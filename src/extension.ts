import * as vscode from 'vscode';
import { findAndNavigateImplementations, getOutputChannel } from './implFinder';

export function activate(context: vscode.ExtensionContext): void {
  const channel = getOutputChannel();
  channel.appendLine(`[${new Date().toISOString()}] smart-goto-impl activated`);

  const disposable = vscode.commands.registerCommand(
    'smart-goto-impl.goToImplementation',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      if (editor.document.languageId !== 'csharp') {
        return;
      }
      await findAndNavigateImplementations(
        editor.document.uri,
        editor.selection.active
      );
    }
  );

  context.subscriptions.push(disposable, channel);
}

export function deactivate(): void {
  // no-op
}
