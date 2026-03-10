/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from '../../../../base/common/uri.js';
import { EditorInputCapabilities, IUntypedEditorInput, isEditorInput } from '../../../common/editor.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { basename } from '../../../../base/common/resources.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';

export class ClarityEditorInput extends EditorInput {

	static readonly ID = 'workbench.editors.clarityEditor';

	static create(instantiationService: IInstantiationService, resource: URI): ClarityEditorInput {
		return instantiationService.createInstance(ClarityEditorInput, resource);
	}

	constructor(
		readonly resource: URI,
	) {
		super();
	}

	override get typeId(): string {
		return ClarityEditorInput.ID;
	}

	override get editorId(): string {
		return ClarityEditorInput.ID;
	}

	override get capabilities(): EditorInputCapabilities {
		return EditorInputCapabilities.Readonly | EditorInputCapabilities.Singleton;
	}

	override getName(): string {
		return basename(this.resource);
	}

	override matches(otherInput: EditorInput | IUntypedEditorInput): boolean {
		if (isEditorInput(otherInput)) {
			return otherInput instanceof ClarityEditorInput && otherInput.resource.toString() === this.resource.toString();
		}
		return false;
	}
}
