/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/clarity.css';
import { localize } from '../../../../nls.js';
import { IViewPaneOptions, ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { IFileService, IFileStat } from '../../../../platform/files/common/files.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { URI } from '../../../../base/common/uri.js';
import { WorkbenchAsyncDataTree } from '../../../../platform/list/browser/listService.js';
import { IAsyncDataSource, ITreeRenderer, ITreeNode } from '../../../../base/browser/ui/tree/tree.js';
import { IIdentityProvider, IListVirtualDelegate } from '../../../../base/browser/ui/list/list.js';
import { extname } from '../../../../base/common/resources.js';
import * as dom from '../../../../base/browser/dom.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { FuzzyScore } from '../../../../base/common/filters.js';
import { ClarityEditorInput } from './clarityEditorInput.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';

const CLARITY_FILE_EXTENSIONS = new Set(['.md', '.yaml', '.yml', '.txt']);

interface IClarityFileItem {
	readonly resource: URI;
	readonly name: string;
	readonly isDirectory: boolean;
}

class ClarityDataSource implements IAsyncDataSource<URI, IClarityFileItem> {

	constructor(
		private readonly fileService: IFileService,
	) { }

	hasChildren(element: URI | IClarityFileItem): boolean {
		if (URI.isUri(element)) {
			return true;
		}
		return element.isDirectory;
	}

	async getChildren(element: URI | IClarityFileItem): Promise<IClarityFileItem[]> {
		const uri = URI.isUri(element) ? element : element.resource;
		let stat: IFileStat;
		try {
			stat = await this.fileService.resolve(uri);
		} catch {
			return [];
		}

		if (!stat.children) {
			return [];
		}

		const items: IClarityFileItem[] = [];
		for (const child of stat.children) {
			if (child.isDirectory) {
				// Check if directory has any matching files recursively
				items.push({
					resource: child.resource,
					name: child.name,
					isDirectory: true,
				});
			} else {
				const ext = extname(child.resource).toLowerCase();
				if (CLARITY_FILE_EXTENSIONS.has(ext)) {
					items.push({
						resource: child.resource,
						name: child.name,
						isDirectory: false,
					});
				}
			}
		}

		// Sort: directories first, then alphabetically
		items.sort((a, b) => {
			if (a.isDirectory !== b.isDirectory) {
				return a.isDirectory ? -1 : 1;
			}
			return a.name.localeCompare(b.name);
		});

		return items;
	}
}

interface IClarityFileTemplateData {
	readonly container: HTMLElement;
	readonly icon: HTMLElement;
	readonly label: HTMLElement;
}

class ClarityFileRenderer implements ITreeRenderer<IClarityFileItem, FuzzyScore, IClarityFileTemplateData> {

	static readonly TEMPLATE_ID = 'clarityFile';

	readonly templateId = ClarityFileRenderer.TEMPLATE_ID;

	renderTemplate(container: HTMLElement): IClarityFileTemplateData {
		const wrapper = dom.append(container, dom.$('.clarity-file-item'));
		const icon = dom.append(wrapper, dom.$('.clarity-file-icon'));
		const label = dom.append(wrapper, dom.$('.clarity-file-label'));
		return { container: wrapper, icon, label };
	}

	renderElement(node: ITreeNode<IClarityFileItem, FuzzyScore>, _index: number, templateData: IClarityFileTemplateData): void {
		const element = node.element;
		templateData.label.textContent = element.name;
		templateData.icon.className = 'clarity-file-icon';

		if (element.isDirectory) {
			templateData.icon.classList.add(...ThemeIcon.asClassNameArray(Codicon.folder));
		} else {
			const ext = extname(element.resource).toLowerCase();
			if (ext === '.md') {
				templateData.icon.classList.add(...ThemeIcon.asClassNameArray(Codicon.markdown));
			} else if (ext === '.yaml' || ext === '.yml') {
				templateData.icon.classList.add(...ThemeIcon.asClassNameArray(Codicon.code));
			} else {
				templateData.icon.classList.add(...ThemeIcon.asClassNameArray(Codicon.file));
			}
		}
	}

	disposeTemplate(templateData: IClarityFileTemplateData): void {
		// No-op
	}
}

class ClarityFileDelegate implements IListVirtualDelegate<IClarityFileItem> {
	getHeight(): number {
		return 28;
	}

	getTemplateId(): string {
		return ClarityFileRenderer.TEMPLATE_ID;
	}
}

class ClarityFileIdentityProvider implements IIdentityProvider<IClarityFileItem> {
	getId(element: IClarityFileItem): string {
		return element.resource.toString();
	}
}

export class ClarityFileTreeView extends ViewPane {

	static readonly ID = 'workbench.view.clarity.fileTree';
	static readonly NAME = localize('clarityFileTree', "Documents");

	private tree!: WorkbenchAsyncDataTree<URI, IClarityFileItem, FuzzyScore>;
	private treeContainer!: HTMLElement;

	constructor(
		options: IViewPaneOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
		@IWorkspaceContextService private readonly workspaceContextService: IWorkspaceContextService,
		@IFileService private readonly fileService: IFileService,
		@IEditorService private readonly editorService: IEditorService,
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);

		this.treeContainer = dom.append(container, dom.$('.clarity-file-tree'));

		const dataSource = new ClarityDataSource(this.fileService);
		const renderer = new ClarityFileRenderer();

		this.tree = this.instantiationService.createInstance(
			WorkbenchAsyncDataTree,
			'ClarityFileTree',
			this.treeContainer,
			new ClarityFileDelegate(),
			[renderer],
			dataSource,
			{
				identityProvider: new ClarityFileIdentityProvider(),
				accessibilityProvider: {
					getAriaLabel(element: IClarityFileItem): string {
						return element.name;
					},
					getWidgetAriaLabel(): string {
						return localize('clarityFileTreeAriaLabel', "Clarity Documents");
					}
				}
			}
		) as WorkbenchAsyncDataTree<URI, IClarityFileItem, FuzzyScore>;

		this._register(this.tree);

		const treeDisposables = this._register(new DisposableStore());

		// Handle file selection
		treeDisposables.add(this.tree.onDidChangeSelection(e => {
			if (e.elements.length === 1 && !e.elements[0].isDirectory) {
				const item = e.elements[0];
				this.editorService.openEditor(
					ClarityEditorInput.create(this.instantiationService, item.resource)
				);
			}
		}));

		// Set initial input
		const folders = this.workspaceContextService.getWorkspace().folders;
		if (folders.length > 0) {
			this.tree.setInput(folders[0].uri);
		}

		// React to workspace changes
		treeDisposables.add(this.workspaceContextService.onDidChangeWorkspaceFolders(() => {
			const updatedFolders = this.workspaceContextService.getWorkspace().folders;
			if (updatedFolders.length > 0) {
				this.tree.setInput(updatedFolders[0].uri);
			}
		}));
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
		this.tree?.layout(height, width);
	}
}
