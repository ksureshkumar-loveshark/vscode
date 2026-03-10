/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/clarity.css';
import * as dom from '../../../../base/browser/dom.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { extname } from '../../../../base/common/resources.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { IEditorOpenContext } from '../../../common/editor.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { IEditorGroup } from '../../../services/editor/common/editorGroupsService.js';
import { IEditorOptions } from '../../../../platform/editor/common/editor.js';
import { IExtensionService } from '../../../services/extensions/common/extensions.js';
import { ILanguageService } from '../../../../editor/common/languages/language.js';
import { renderMarkdownDocument, DEFAULT_MARKDOWN_STYLES } from '../../markdown/browser/markdownDocumentRenderer.js';
import { ClarityEditorInput } from './clarityEditorInput.js';

export class ClarityEditorPane extends EditorPane {

	static readonly ID = 'workbench.editor.clarityEditor';

	private container: HTMLElement | undefined;
	private contentElement: HTMLElement | undefined;

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IFileService private readonly fileService: IFileService,
		@IExtensionService private readonly extensionService: IExtensionService,
		@ILanguageService private readonly languageService: ILanguageService,
	) {
		super(ClarityEditorPane.ID, group, telemetryService, themeService, storageService);
	}

	protected createEditor(parent: HTMLElement): void {
		this.container = dom.append(parent, dom.$('.clarity-editor'));
		this.contentElement = dom.append(this.container, dom.$('.clarity-editor-content'));
	}

	override async setInput(input: EditorInput, options: IEditorOptions | undefined, context: IEditorOpenContext, token: CancellationToken): Promise<void> {
		await super.setInput(input, options, context, token);

		if (!(input instanceof ClarityEditorInput)) {
			return;
		}

		if (token.isCancellationRequested) {
			return;
		}

		const content = await this.fileService.readFile(input.resource);
		if (token.isCancellationRequested) {
			return;
		}

		const text = content.value.toString();
		const ext = extname(input.resource).toLowerCase();

		if (!this.contentElement) {
			return;
		}

		if (ext === '.md') {
			await this.renderMarkdown(text, token);
		} else {
			this.renderPlainText(text);
		}
	}

	private async renderMarkdown(text: string, token: CancellationToken): Promise<void> {
		if (!this.contentElement) {
			return;
		}

		const html = await renderMarkdownDocument(text, this.extensionService, this.languageService, undefined, token);
		if (token.isCancellationRequested) {
			return;
		}

		this.contentElement.innerHTML = '';
		const wrapper = dom.append(this.contentElement, dom.$('.clarity-markdown-body'));
		// Inject styles inline
		const styleEl = document.createElement('style');
		styleEl.textContent = DEFAULT_MARKDOWN_STYLES;
		wrapper.appendChild(styleEl);
		// Create a div to hold the rendered HTML
		const contentDiv = dom.append(wrapper, dom.$('.clarity-markdown-content'));
		contentDiv.innerHTML = html as unknown as string;
	}

	private renderPlainText(text: string): void {
		if (!this.contentElement) {
			return;
		}

		this.contentElement.innerHTML = '';
		const pre = dom.append(this.contentElement, dom.$('pre.clarity-plaintext'));
		pre.textContent = text;
	}

	override clearInput(): void {
		if (this.contentElement) {
			this.contentElement.innerHTML = '';
		}
		super.clearInput();
	}

	layout(dimension: dom.Dimension): void {
		if (this.container) {
			this.container.style.width = `${dimension.width}px`;
			this.container.style.height = `${dimension.height}px`;
		}
	}
}
