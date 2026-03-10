/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize, localize2 } from '../../../../nls.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { IViewDescriptorService, IViewContainersRegistry, Extensions, ViewContainerLocation, ViewContainer } from '../../../common/views.js';
import { IWorkbenchLayoutService } from '../../../services/layout/browser/layoutService.js';
import { IExtensionService } from '../../../services/extensions/common/extensions.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { KeyMod, KeyCode } from '../../../../base/common/keyCodes.js';

export const CLARITY_VIEWLET_ID = 'workbench.view.clarity';
export const CLARITY_VIEW_ID = 'workbench.view.clarity.fileTree';

const clarityViewIcon = registerIcon('clarity-view-icon', Codicon.book, localize('clarityViewIcon', 'View icon of the Clarity view.'));

export class ClarityViewPaneContainer extends ViewPaneContainer {

	constructor(
		@IWorkbenchLayoutService layoutService: IWorkbenchLayoutService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IWorkspaceContextService contextService: IWorkspaceContextService,
		@IStorageService storageService: IStorageService,
		@IConfigurationService configurationService: IConfigurationService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IThemeService themeService: IThemeService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IExtensionService extensionService: IExtensionService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@ILogService logService: ILogService,
	) {
		super(CLARITY_VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService, logService);
	}

	override create(parent: HTMLElement): void {
		super.create(parent);
		parent.classList.add('clarity-viewlet');
	}
}

const viewContainerRegistry = Registry.as<IViewContainersRegistry>(Extensions.ViewContainersRegistry);

export const CLARITY_VIEW_CONTAINER: ViewContainer = viewContainerRegistry.registerViewContainer({
	id: CLARITY_VIEWLET_ID,
	title: localize2('clarity', "Clarity"),
	ctorDescriptor: new SyncDescriptor(ClarityViewPaneContainer),
	storageId: 'workbench.clarity.views.state',
	icon: clarityViewIcon,
	alwaysUseContainerInfo: true,
	hideIfEmpty: false,
	order: 10,
	openCommandActionDescriptor: {
		id: CLARITY_VIEWLET_ID,
		title: localize2('clarity', "Clarity"),
		mnemonicTitle: localize({ key: 'miViewClarity', comment: ['&& denotes a mnemonic'] }, "&&Clarity"),
		keybindings: { primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyL },
		order: 10
	},
}, ViewContainerLocation.Sidebar, { isDefault: true });
