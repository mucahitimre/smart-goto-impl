import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('Smart Go to Impl');
  }
  return outputChannel;
}

interface NormalizedLocation {
  uri: vscode.Uri;
  range: vscode.Range;
  selectionRange: vscode.Range;
}

function normalize(
  result: vscode.Location | vscode.LocationLink
): NormalizedLocation {
  if ('targetUri' in result) {
    return {
      uri: result.targetUri,
      range: result.targetRange,
      selectionRange: result.targetSelectionRange ?? result.targetRange
    };
  }
  return {
    uri: result.uri,
    range: result.range,
    selectionRange: result.range
  };
}

function dedupe(items: NormalizedLocation[]): NormalizedLocation[] {
  const seen = new Set<string>();
  const out: NormalizedLocation[] = [];
  for (const item of items) {
    const key = `${item.uri.toString()}|${item.selectionRange.start.line}:${item.selectionRange.start.character}-${item.selectionRange.end.line}:${item.selectionRange.end.character}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(item);
  }
  return out;
}

function filterCaller(
  items: NormalizedLocation[],
  callerUri: vscode.Uri,
  callerPos: vscode.Position
): NormalizedLocation[] {
  const callerKey = callerUri.toString();
  return items.filter((item) => {
    if (item.uri.toString() !== callerKey) {
      return true;
    }
    return !item.range.contains(callerPos);
  });
}

async function executeImplementationProviderWithTimeout(
  uri: vscode.Uri,
  position: vscode.Position,
  timeoutMs: number
): Promise<(vscode.Location | vscode.LocationLink)[] | undefined> {
  const lookup = vscode.commands.executeCommand<
    (vscode.Location | vscode.LocationLink)[]
  >('vscode.executeImplementationProvider', uri, position);

  const timeout = new Promise<undefined>((resolve) =>
    setTimeout(() => resolve(undefined), timeoutMs)
  );

  return Promise.race([lookup, timeout]);
}

export async function findAndNavigateImplementations(
  uri: vscode.Uri,
  position: vscode.Position
): Promise<void> {
  const channel = getOutputChannel();
  const ts = new Date().toISOString();

  try {
    const raw = await executeImplementationProviderWithTimeout(
      uri,
      position,
      1500
    );

    if (raw === undefined) {
      channel.appendLine(`[${ts}] implementation provider timed out`);
      vscode.window.showInformationMessage('C# dil servisi hazır değil.');
      return;
    }

    const normalized = raw.map(normalize);
    const filtered = filterCaller(normalized, uri, position);
    const results = dedupe(filtered);
    channel.appendLine(
      `[${ts}] raw=${raw.length} afterCallerFilter=${filtered.length} afterDedupe=${results.length}`
    );

    if (results.length === 0) {
      vscode.window.showInformationMessage('İmplementasyon bulunamadı.');
      return;
    }

    if (results.length === 1) {
      const target = results[0];
      const doc = await vscode.workspace.openTextDocument(target.uri);
      const editor = await vscode.window.showTextDocument(doc, {
        preview: false
      });
      editor.revealRange(
        target.selectionRange,
        vscode.TextEditorRevealType.InCenter
      );
      editor.selection = new vscode.Selection(
        target.selectionRange.start,
        target.selectionRange.start
      );
      return;
    }

    const allCommands = await vscode.commands.getCommands(true);
    if (allCommands.includes('references-view.findImplementations')) {
      await vscode.commands.executeCommand(
        'references-view.findImplementations'
      );
    } else {
      vscode.window.showInformationMessage(
        'References View bulunamadı, fallback kullanılıyor.'
      );
      await vscode.commands.executeCommand('editor.action.goToImplementation');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack ?? '' : '';
    channel.appendLine(`[${ts}] ERROR: ${message}\n${stack}`);
    vscode.window.showErrorMessage(`İmplementasyon arama hatası: ${message}`);
  }
}
