// For Zamrod.
// Special thanks to Reaver.

import { getCanvas, matchBoundKeyEvent, MODULE_NAME } from './settings';
import { TargetEnhancements } from './TargetEnhancements';

export class EasyTarget {
	static getTemplateShape = function (template) {
		let shape = template.data.t;
		shape = shape[0].toUpperCase() + shape.substring(1);

		const fn = MeasuredTemplate.prototype[`_get${shape}Shape`];
		const dim = getCanvas().dimensions;
		let {direction, distance, angle, width} = template.data;

		distance *= (dim.size / dim.distance);
		width *= (dim.size / dim.distance);
		direction = toRadians(direction);

		switch (shape) {
			case 'Circle': return fn.apply(template, [distance]);
			case 'Cone': return fn.apply(template, [direction, angle, distance]);
			case 'Rect': return fn.apply(template, [direction, distance]);
			case 'Ray': return fn.apply(template, [direction, distance, width]);
		}
	}

	static releaseOthersMap = new WeakMap();

	// patch = function () {
	// 	const releaseOthersMap = new WeakMap();

		static tokenSetTarget = function (wrapped, ...args) {
			const releaseOthers = EasyTarget.releaseOthersMap.get(this);
			if (releaseOthers !== undefined) {
				args[1].releaseOthers = releaseOthers;
			}

			// MOD 4535992
			let targeted = this.targeted.size == 0 ? false : true;

			TargetEnhancements.targetTokenEventHandler(game.user, this, targeted);

			// END MOD 4535992
			return wrapped(...args);
		}

		static tokenOnClickLeft = function (wrapped, ...args) {
			const [ event ] = args;
			const oe = event.data.originalEvent;
			const tool = ui.controls.control.activeTool;

			//if (oe.altKey) {
			//if (KeyBinding.eventIsForBinding(oe, parsedValueKeyBindingTarget)) {
      		if(matchBoundKeyEvent(oe)){
				ui.controls.control.activeTool = 'target';
			}

			if (ui.controls.control.activeTool === 'target') {
				EasyTarget.releaseOthersMap.set(this, EasyTarget.releaseBehaviour(oe));
			}

			wrapped(...args);

			EasyTarget.releaseOthersMap.delete(this);

			ui.controls.control.activeTool = tool;
		}

		static tokenCanControl = function (wrapped, ...args) {
			const [ user, event ] = args;

			if (!event) {
				return wrapped(...args);
			}

			const oe = event.data.originalEvent;
			const tool = ui.controls.control.activeTool;

			//if (oe.altKey) {
			//if (KeyBinding.eventIsForBinding(oe, parsedValueKeyBindingTarget)) {
      		if(matchBoundKeyEvent(oe)){
				ui.controls.control.activeTool = 'target';
			}

			const canControl = wrapped(...args);

			ui.controls.control.activeTool = tool;

			return canControl;
		}

		static tokenLayerTargetObjects = function (wrapped, ...args) {
			const releaseOthers = EasyTarget.releaseOthersMap.get(this);

			if (releaseOthers !== undefined) {
				args[1].releaseOthers = releaseOthers;
			}

			return wrapped(...args);
		}

		static canvasOnClickLeft = function (wrapped, ...args) {
			const [ event ] = args;
			const oe = event.data.originalEvent;
			const tool = ui.controls.control.activeTool;
			const selectState = event.data._selectState;

			//if (oe.altKey) {
			//if (KeyBinding.eventIsForBinding(oe, parsedValueKeyBindingTarget)) {
      		if(matchBoundKeyEvent(oe)){
				ui.controls.control.activeTool = 'target';
			}

			wrapped(...args);

			//if (oe.altKey && selectState !== 2) {
			//if (KeyBinding.eventIsForBinding(oe, parsedValueKeyBindingTarget) !== 2) {
      		if (matchBoundKeyEvent(oe) && selectState !== 2) {
				const {x: ox, y: oy} = event.data.origin;
				const templates = getCanvas().templates.objects.children.filter(template => {
					const {x: cx, y: cy} = template.center;
					return template.shape.contains(ox - cx, oy - cy);
				});

				EasyTarget.targetTokensInArea(templates, EasyTarget.releaseBehaviour(oe));
			}

			ui.controls.control.activeTool = tool;
		}

		static canvasOnDragLeftDrop = function (wrapped, ...args) {
			const [ event ] = args;
			const oe = event.data.originalEvent;
			const tool = ui.controls.control.activeTool;
			const layer = getCanvas().activeLayer;

			//if (oe.altKey) {
			//if (KeyBinding.eventIsForBinding(oe, parsedValueKeyBindingTarget)) {
     		if(matchBoundKeyEvent(oe)){
				ui.controls.control.activeTool = 'target';
			}

			if (ui.controls.control.activeTool === 'target') {
				EasyTarget.releaseOthersMap.set(layer, EasyTarget.releaseBehaviour(oe));
			}

			wrapped(...args);

			EasyTarget.releaseOthersMap.delete(layer);

			ui.controls.control.activeTool = tool;
		}

		static templateLayerOnDragLeftDrop = function (wrapped, ...args) {
			const [ event ] = args;
			const object = event.data.preview;
			const oe = event.data.originalEvent;

			wrapped(...args);

			//if (oe.altKey) {
			//if (KeyBinding.eventIsForBinding(oe, parsedValueKeyBindingTarget)) {
      		if(matchBoundKeyEvent(oe)){
				const template = new MeasuredTemplate(object.data);
				template.shape = EasyTarget.getTemplateShape(template);
				EasyTarget.targetTokensInArea([template], EasyTarget.releaseBehaviour(oe));
			}
		}

		static keyboardManagerOnKeyC = function (wrapped, ...args) {
			const [ event, up, modifiers ] = args;

			if (!(modifiers.isShift && modifiers.isAlt)) {
				wrapped(...args);
			}
		}
		// MOD 4535992
		static tokenOnControl = function (wrapped, ...args) {
			for(let elem of args){
				const releaseOthers = elem.releaseOthers;
				const updateSight = elem.updateSight;
				TargetEnhancements.controlTokenEventHandler(this,releaseOthers);
			}
			return wrapped(...args);
		}
		// END MOD 4535992
		// if (game.modules.get('lib-wrapper')?.active) {
		// 	libWrapper.register(MODULE_NAME, 'Token.prototype.setTarget', tokenSetTarget, 'WRAPPER');
		// 	libWrapper.register(MODULE_NAME, 'Token.prototype._onClickLeft', tokenOnClickLeft, 'WRAPPER');
		// 	libWrapper.register(MODULE_NAME, 'Token.prototype._canControl', tokenCanControl, 'WRAPPER');
		// 	libWrapper.register(MODULE_NAME, 'TokenLayer.prototype.targetObjects', tokenLayerTargetObjects, 'WRAPPER');
		// 	libWrapper.register(MODULE_NAME, 'Canvas.prototype._onClickLeft', canvasOnClickLeft, 'WRAPPER');
		// 	libWrapper.register(MODULE_NAME, 'Canvas.prototype._onDragLeftDrop', canvasOnDragLeftDrop, 'WRAPPER');
		// 	libWrapper.register(MODULE_NAME, 'TemplateLayer.prototype._onDragLeftDrop', templateLayerOnDragLeftDrop, 'WRAPPER');
		// 	libWrapper.register(MODULE_NAME, 'KeyboardManager.prototype._onKeyC', keyboardManagerOnKeyC, 'MIXED');
		// 	// MOD 4535992
		// 	libWrapper.register(MODULE_NAME, 'Token.prototype.control', tokenOnControl, 'WRAPPER');
		// 	// END MOD 4535992
		// } else {
		// 	error("YOU MUST USE lib-wrapper");

		// 	const cachedTokenSetTarget = Token.prototype.setTarget;
		// 	Token.prototype.setTarget = function () {
		// 		return tokenSetTarget.call(this, cachedTokenSetTarget.bind(this), ...arguments);
		// 	};

		// 	const cachedTokenOnClickLeft = Token.prototype._onClickLeft;
		// 	Token.prototype._onClickLeft = function () {
		// 		return tokenOnClickLeft.call(this, cachedTokenOnClickLeft.bind(this), ...arguments);
		// 	};

		// 	const cachedTokenCanControl = Token.prototype._canControl;
		// 	Token.prototype._canControl = function () {
		// 		return tokenCanControl.call(this, cachedTokenCanControl.bind(this), ...arguments);
		// 	};

		// 	const cachedTokenLayerTargetObjects = TokenLayer.prototype.targetObjects;
		// 	TokenLayer.prototype.targetObjects = function () {
		// 		return tokenLayerTargetObjects.call(this, cachedTokenLayerTargetObjects.bind(this), ...arguments);
		// 	};

		// 	const cachedCanvasOnClickLeft = Canvas.prototype._onClickLeft;
		// 	Canvas.prototype._onClickLeft = function () {
		// 		return canvasOnClickLeft.call(this, cachedCanvasOnClickLeft.bind(this), ...arguments);
		// 	};

		// 	const cachedCanvasOnDragLeftDrop = Canvas.prototype._onDragLeftDrop;
		// 	Canvas.prototype._onDragLeftDrop = function () {
		// 		return canvasOnDragLeftDrop.call(this, cachedCanvasOnDragLeftDrop.bind(this), ...arguments);
		// 	};

		// 	const cachedTemplateLayerOnDragLeftDrop = TemplateLayer.prototype._onDragLeftDrop;
		// 	TemplateLayer.prototype._onDragLeftDrop = function () {
		// 		return templateLayerOnDragLeftDrop.call(this, cachedTemplateLayerOnDragLeftDrop.bind(this), ...arguments);
		// 	};

		// 	const cachedKeyboardManagerOnKeyC = KeyboardManager.prototype._onKeyC;
		// 	KeyboardManager.prototype._onKeyC = function () {
		// 		return keyboardManagerOnKeyC.call(this, cachedKeyboardManagerOnKeyC.bind(this), ...arguments);
		// 	};
		// }
	// }

	static releaseBehaviour = function (oe) {
		const mode = game.settings.get(MODULE_NAME, 'release');
		if (mode === 'sticky') {
			//return !oe.shiftKey && !oe.altKey;
			//return !oe.shiftKey && !KeyBinding.eventIsForBinding(oe, parsedValueKeyBindingTarget);
      		return !oe.shiftKey && !matchBoundKeyEvent(oe);
		}

		return !oe.shiftKey;
	}

	static targetTokensInArea = function (templates, releaseOthers) {
		if (releaseOthers) {
			game.user.targets.forEach(token =>
				token.setTarget(false, {releaseOthers: false, groupSelection: true})
			);

		}

		getCanvas().tokens.objects.children.filter((token:Token) => {
			const {x: ox, y: oy} = token.center;
			return templates.some(template => {
				const {x: cx, y: cy} = template.center;
				return template.shape.contains(ox - cx, oy - cy);
			});
		}).forEach((token:Token) => token.setTarget(true, {releaseOthers: false, groupSelection: true}));
		game.user.broadcastActivity({targets: game.user.targets.ids});
	}
};

// document.addEventListener('keydown', event => {
// 	if (event.altKey && event.key === 'C') {
// 		game.user.targets.forEach(token =>
// 			token.setTarget(false, {releaseOthers: false, groupSelection: true})
// 		);
// 		game.user.broadcastActivity({targets: game.user.targets.ids});
// 	}
// });

document.addEventListener('keydown', event => {
  if (matchBoundKeyEvent(event) && event.key === 'C') {
    event.stopPropagation();
    event.preventDefault();
    game.user.targets.forEach(token =>
		token.setTarget(false, {releaseOthers: false, groupSelection: true})
	);
	game.user.broadcastActivity({targets: game.user.targets.ids});
  }
});
