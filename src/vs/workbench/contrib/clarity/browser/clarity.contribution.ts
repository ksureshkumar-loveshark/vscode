/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize2 } from '../../../../nls.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { EditorExtensions } from '../../../common/editor.js';
import { IViewsRegistry, Extensions as ViewExtensions, IViewDescriptor } from '../../../common/views.js';
import { IWorkbenchContribution, WorkbenchPhase, registerWorkbenchContribution2 } from '../../../common/contributions.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';
import { mainWindow } from '../../../../base/browser/window.js';
import { ClarityFileTreeView } from './clarityFileTreeView.js';
import { CLARITY_VIEW_CONTAINER, CLARITY_VIEW_ID, CLARITY_VIEWLET_ID } from './clarityViewlet.js';
import { ClarityEditorPane } from './clarityEditorPane.js';
import { ClarityEditorInput } from './clarityEditorInput.js';

// ----- Register the Clarity file tree view inside the Clarity view container -----

const viewsRegistry = Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry);

const clarityFileTreeViewDescriptor: IViewDescriptor = {
	id: CLARITY_VIEW_ID,
	name: localize2('clarityDocuments', "Documents"),
	ctorDescriptor: new SyncDescriptor(ClarityFileTreeView),
	order: 0,
	canToggleVisibility: false,
	canMoveView: false,
	collapsed: false,
};

viewsRegistry.registerViews([clarityFileTreeViewDescriptor], CLARITY_VIEW_CONTAINER);

// ----- Register the Clarity editor pane -----

Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(
		ClarityEditorPane,
		ClarityEditorPane.ID,
		'Clarity Document Viewer'
	),
	[new SyncDescriptor(ClarityEditorInput)]
);

// ----- Clarity layout manager: enter Clarity mode on startup, handle VS Code escape hatch -----

class ClarityLayoutManager implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.clarityLayoutManager';

	constructor(
		@IWorkspaceContextService workspaceContextService: IWorkspaceContextService,
		@IViewsService private readonly viewsService: IViewsService,
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
	) {
		// Enter Clarity mode: hide VS Code chrome
		this.layoutService.setPartHidden(true, Parts.ACTIVITYBAR_PART);
		this.layoutService.setPartHidden(true, Parts.STATUSBAR_PART);
		this.layoutService.setPartHidden(true, Parts.PANEL_PART);

		// Open Clarity sidebar
		this.viewsService.openViewContainer(CLARITY_VIEWLET_ID, true);

		// Auto-dismiss overlay if workspace is open
		const folders = workspaceContextService.getWorkspace().folders;
		if (folders.length > 0) {
			mainWindow.document.getElementById('clarity-startup-overlay')?.remove();
		}

		// Listen for "Take Me To VS Code" button
		mainWindow.addEventListener('clarity:showVSCode', () => {
			this.layoutService.setPartHidden(false, Parts.ACTIVITYBAR_PART);
			this.layoutService.setPartHidden(false, Parts.STATUSBAR_PART);
			this.viewsService.openViewContainer('workbench.view.explorer', true);
		});
	}
}

registerWorkbenchContribution2(ClarityLayoutManager.ID, ClarityLayoutManager, WorkbenchPhase.AfterRestored);
