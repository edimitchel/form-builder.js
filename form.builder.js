;(function(context) {
	'use strict';

	function FormBuilder(options, data) {
		this.__init();

		this.values = data || {};
		
		this.configure(options);

		var that = this;

		return this;
	}

	FormBuilder.defaults = {
		timeAfterWriting : 250, //miliseconds
		form : {
			method: "POST",
			action: "#"
		}
	}

	FormBuilder.prototype.__init = function() {
		this.fields = [];
	}

	FormBuilder.prototype.configure = function(options) {
		this.options = FormBuilder.defaults.merge(options);
	}

	FormBuilder.prototype.Field = function() {
		this.selected = {
			form : this,
			node : null
		};

		this.field = function(type, nameOrOptions) {
			var field = FormBuilder.fields[type];
			if(typeof nameOrOptions == "string" || typeof nameOrOptions == "undefined") {
				field.setAttribute('name', nameOrOptions);
			} else if(typeof nameOrOptions == "object") {
				field.setAttributes(nameOrOptions);
			}
			this.selected.node = field;
			return this.add(field);
		}

		this.add = function(field) {
			this.fields.push(field);
			return field;
		}

		this.input = function(nameOrOptions) {
			var input = this.field('input', nameOrOptions);

			return this.selected;
		}

		this.textarea = function(nameOrOptions) {
			var textarea = this.field('textarea', nameOrOptions);

			return this.selected;
		}

		this.button = function(nameOrOptions) {
			var button = this.field('button', nameOrOptions);
			button.type = "submit";
			
			return this.selected;
		}

		this.selected.on = function(eventType, callback) {
			this.form.Event().add(this.node, eventType, callback);
			return this;
		}

		return this;
	};

	FormBuilder.prototype.Form = function() {
		
		this.configure = function(options) {
			this.options.form = this.options.form.merge(options);
		}

		this.get = function() {
			var form = document.createElement('form');
			form.setAttributes(this.options.form);

			var that = this;
			form.onsubmit = function(evt) {
				that.onSubmit(evt, that.fields.map(function(el) {
						return {field : el, value : (el.value == 'undefined') ? '' : el.value};
					})
				);

				if(that.preventDefault === true)
					evt.preventDefault();
				
				return !that.preventDefault;
			}
			return form;
		}

		return this;
	};

	FormBuilder.prototype.Validator = function() {
		return this;
	};


	FormBuilder.prototype.Event = function() {
		this.timer = null;

		this.events = ['writing', 'afterwriting', 'keypress', 'keydown', 'keyup', 'focus', 'blur', 'click', 'dblclick'];

		this.add = function(element, evtType, callback) {
			if(this.events.indexOf(evtType) >= 0) {
				if(typeof element['on' + evtType] == "undefined") {
					switch(evtType) {
						case 'writing':
							this.add(element, 'keyup', callback);
							break;

						case 'afterwriting':
							// Fire callback after X millisecond before last key up
							var t = this;
							element.onkeyup = function(evt) {
								clearTimeout(t.timer);
								t.timer = setTimeout(function() {
									callback(element.value, evt);
								}, t.options.timeAfterWriting);
							}							
							break;

						default:
							throw new Error('Event type isn\'t implemented');
					}
				} else {
					element.addEventListener(evtType, function(evt) {
						callback(element.value, evt);
					}, false);
				}
			} else {
				throw new Error('The ' + evtType + ' event is unknow.');
			}
		}

		return this;
	};

	FormBuilder.prototype.setWrapper = function(wrapperSelector) {
		var element = document.querySelector(wrapperSelector);
		if(element != null)
			this.wrapper = element;
		else
			throw new Error('Wrapper isn\'t found');
	};

	FormBuilder.prototype.setFieldWrapper = function(wrapperTag, attributes) {
		var element = document.createElement(wrapperTag);
		if(typeof attributes == 'object')
			element.setAttributes(attributes);

		this.fieldWrap = element;
	};

	FormBuilder.prototype.setOnSubmit = function(callback, prevDft) {
		this.onSubmit = callback;
		this.preventDefault = prevDft;
	};

	FormBuilder.prototype.render = function() {
		if(!this.wrapper)
			throw new Error('Wrapper must be defined.');

		var form = this.Form().get();

		for(var i in this.fields) {
			if(this.fields.hasOwnProperty(i)) {
				var f = this.fields[i];
				if(this.values[f.name] != "undefined") {
					f.setAttribute('value', this.values[f.name]);
				}

				var wrap = f;
				if(typeof this.fieldWrap != 'undefined') {
					wrap = this.fieldWrap.cloneNode()
					wrap.appendChild(f);
				}

				form.appendChild(wrap);
			}
		}

		this.wrapper.appendChild(form);
	};

	FormBuilder.fields = {
		'input' : document.createElement('input'),
		'textarea' : document.createElement('textarea'),
		'button' : document.createElement('button')
	}

	Object.prototype.setAttributes = function(attributes) {
		for(var i in attributes) {
			if(attributes.hasOwnProperty(i)) {
				if(i == "innerContent")
					this.innerHTML = attributes[i];
				else
					this.setAttribute(i, attributes[i]);
			}
		}
		return this;
	}

	Object.prototype.merge = function(obj) {
		if(typeof obj == 'object') {
			for (var p in obj) {
				try {
					if (obj[p].constructor==Object) 
						this[p] = this[p].merge(obj[p]);
					else 
						this[p] = obj[p];					
				} catch(e) {
					this[p] = obj[p];
				}
			}
		}
		return this;
	};

	context.FormBuilder = FormBuilder;

})(this);
