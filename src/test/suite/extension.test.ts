import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { findAndNavigateImplementations } from '../../implFinder';

suite('smart-goto-impl extension', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('smart-goto-impl.goToImplementation'),
      'command not registered'
    );
  });

  test('no implementations shows info message', async () => {
    const execStub = sandbox.stub(vscode.commands, 'executeCommand');
    execStub
      .withArgs('vscode.executeImplementationProvider', sinon.match.any, sinon.match.any)
      .resolves([]);
    execStub.callThrough();

    const infoSpy = sandbox.stub(vscode.window, 'showInformationMessage').resolves();

    const uri = vscode.Uri.parse('untitled:fake.cs');
    await findAndNavigateImplementations(uri, new vscode.Position(0, 0));

    assert.ok(infoSpy.calledWith('İmplementasyon bulunamadı.'));
  });

  test('single implementation opens directly', async () => {
    const targetUri = vscode.Uri.parse('untitled:Target.cs');
    const range = new vscode.Range(2, 4, 2, 14);

    const execStub = sandbox.stub(vscode.commands, 'executeCommand');
    execStub
      .withArgs('vscode.executeImplementationProvider', sinon.match.any, sinon.match.any)
      .resolves([new vscode.Location(targetUri, range)]);
    execStub.callThrough();

    const fakeEditor = {
      revealRange: sandbox.spy(),
      selection: undefined as unknown
    };

    const showStub = sandbox
      .stub(vscode.window, 'showTextDocument')
      .resolves(fakeEditor as unknown as vscode.TextEditor);
    const openStub = sandbox
      .stub(vscode.workspace, 'openTextDocument' as keyof typeof vscode.workspace)
      .resolves({} as vscode.TextDocument);

    await findAndNavigateImplementations(
      vscode.Uri.parse('untitled:source.cs'),
      new vscode.Position(0, 0)
    );

    assert.ok(openStub.calledOnce, 'openTextDocument not called');
    assert.deepStrictEqual(openStub.firstCall.args[0], targetUri);
    assert.ok(showStub.calledOnce, 'showTextDocument not called');
    assert.ok(fakeEditor.revealRange.calledOnce, 'revealRange not called');
  });

  test('multiple implementations trigger references view', async () => {
    const u1 = vscode.Uri.parse('untitled:A.cs');
    const u2 = vscode.Uri.parse('untitled:B.cs');
    const r = new vscode.Range(0, 0, 0, 1);

    const execStub = sandbox.stub(vscode.commands, 'executeCommand');
    execStub
      .withArgs('vscode.executeImplementationProvider', sinon.match.any, sinon.match.any)
      .resolves([new vscode.Location(u1, r), new vscode.Location(u2, r)]);
    execStub
      .withArgs('references-view.findImplementations')
      .resolves(undefined);
    execStub
      .withArgs('editor.action.goToImplementation')
      .resolves(undefined);
    execStub.callThrough();

    sandbox
      .stub(vscode.commands, 'getCommands')
      .resolves(['references-view.findImplementations']);

    await findAndNavigateImplementations(
      vscode.Uri.parse('untitled:source.cs'),
      new vscode.Position(0, 0)
    );

    assert.ok(
      execStub.calledWith('references-view.findImplementations'),
      'references-view command not called'
    );
  });

  test('fallback to peek when references-view missing', async () => {
    const u1 = vscode.Uri.parse('untitled:A.cs');
    const u2 = vscode.Uri.parse('untitled:B.cs');
    const r = new vscode.Range(0, 0, 0, 1);

    const execStub = sandbox.stub(vscode.commands, 'executeCommand');
    execStub
      .withArgs('vscode.executeImplementationProvider', sinon.match.any, sinon.match.any)
      .resolves([new vscode.Location(u1, r), new vscode.Location(u2, r)]);
    execStub
      .withArgs('editor.action.goToImplementation')
      .resolves(undefined);
    execStub.callThrough();

    sandbox.stub(vscode.commands, 'getCommands').resolves([]);
    sandbox.stub(vscode.window, 'showInformationMessage').resolves();

    await findAndNavigateImplementations(
      vscode.Uri.parse('untitled:source.cs'),
      new vscode.Position(0, 0)
    );

    assert.ok(
      execStub.calledWith('editor.action.goToImplementation'),
      'fallback command not called'
    );
  });
});
