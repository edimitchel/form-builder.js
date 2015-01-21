;(function(context) {
	'use strict';

	/**
	 * Constructor of FormBuilder
	 * @param {object} options Extended options
	 * @param {object} data Data to inject
	 * @return {FormBuild} FormBuild The instance
	 */
	function FormBuilder(options, data) {
		this.values = data || {};
		
		this.configure(options);

		this.__init();

		var that = this;

		return this;
	}

	/**
	 * Static defaults options
	 */
	FormBuilder.defaults = {
		timeAfterWriting : 250, //miliseconds
		field : {
			fieldWrapper : {
				tag : 'p',
				atributes : null
			}
		},
		form : {
			method: "POST",
			action: "#"
		}
	}

	/**
	 * Initialisation of the library
	 */
	FormBuilder.prototype.__init = function() {
		this.fields = [];

		this.Field().__init();
	}

	/**
	 * Configure the library
	 * @param {object} options Extended options
	 */
	FormBuilder.prototype.configure = function(options) {
		var opt = FormBuilder.defaults;
		opt.merge.merge(options);
		this.options = opt;
	}

	/**
	 * Statuc defaults fields : can be change for render
	 */
	FormBuilder.defaultsFields = {
		'input' : document.createElement('input'),
		'textarea' : document.createElement('textarea'),
		'button' : document.createElement('button'),
		'label' : document.createElement('LABEL'),
	}

	/**
	 * Edit a default field | all defaults fields (with a filter) 
	 * @param {string|object} key Key of default field | Modification attributes
	 * @param {object|array} attributes Modification attributes | filter Filter for the modifications of fields
	 * @param {array} filter (Optional) Filter for the modifications of fields
	 */
	FormBuilder.editDefaultField = function(key, attributes, filter) {
		if(typeof key == 'string') {
			FormBuilder.defaultsFields[key] = FormBuilder.defaultsFields[key].setAttributes(attributes);
		} else {
			filter = attributes;
			attributes = key;
			key = null;
			for(var i in FormBuilder.defaultsFields)
				if(FormBuilder.defaultsFields.hasOwnProperty(i) && (filter != undefined && (typeof filter == 'string' && i == filter || filter.indexOf(i) >= 0)))
					FormBuilder.defaultsFields[i] = FormBuilder.defaultsFields[i].setAttributes(attributes);
		}
	}

	/**
	 * Get a field
	 * @param {string} key key of the desired field
	 * @return {object} field The desired field 
	 */
	FormBuilder.getField = function(key) {
		return FormBuilder.defaultsFields[key].cloneNode(true);
	}

	/**
	 * Constructor of Field
	 * @return {Field} Field the instance
	 */
	FormBuilder.prototype.Field = function() {
		this.__init = function() {
			this.setFieldWrapper(this.options.field.fieldWrapper.tag, this.options.field.fieldWrapper.attributes);
		};

		this.selected = {
			form : this,
			node : null
		};

		/**
		 * Constructor of a field
		 * @param {string} type Type of field
		 * @param {string|object} nameOrOptions Name or attributes of the field
		 * @return {object} field The added field 
		 */
		this.field = function(type, nameOrOptions) {
			var field = FormBuilder.getField(type);
			if(typeof nameOrOptions == "string" || typeof nameOrOptions == "undefined") {
				field.setAttribute('name', nameOrOptions);
			} else if(typeof nameOrOptions == "object") {
				field.setAttributes(nameOrOptions);
			}

			this.selected.node = field;

			return this.addElement(field);
		}

		/**
		 * Adds an element to the list of fields
		 * @param {object} field The field to add
		 * @param {object} label (Optional) This label will be added before the field
		 * @return {object} field The added field 
		 */
		this.addElement = function(field, label) {
			if(typeof label != "undefined") {
				var ind = this.fields.indexOf(field);
				this.fields.splice(ind, 0, label);
			} else {
				this.fields.push(field);
			}
			return field;
		}

		/**
		 * Adds an input element to the list of fields
		 * @param {string|object} nameOrOptions Name or attributes of the field
		 * @return {object} field The added input field 
		 */
		this.input = function(nameOrOptions) {
			var input = this.field('input', nameOrOptions);

			return this.selected;
		}


		/**
		 * Adds a textarea element to the list of fields
		 * @param {string|object} nameOrOptions Name or attributes of the field
		 * @return {object} field The added textarea field 
		 */
		this.textarea = function(nameOrOptions) {
			var textarea = this.field('textarea', nameOrOptions);

			return this.selected;
		}


		/**
		 * Adds a button element to the list of fields
		 * @param {string|object} nameOrOptions Name or attributes of the field
		 * @return {object} field The added button field 
		 */
		this.button = function(nameOrOptions) {
			var button = this.field('button', nameOrOptions);
			button.type = "submit";
			
			return this.selected;
		}


		/**
		 * Adds a label element to the list of fields
		 * @param {string} label The name of the label
		 * @param {object} field The linked field
		 * @return {object} field The added label field
		 */
		this.label = function(label, field) {
			var labelNode = FormBuilder.getField('label');
			labelNode.innerHTML = label;
			labelNode.setAttribute('for', field.id);
			return this.addElement(field, labelNode);
		}


		/**
		 * Use in chaine, to add a label to a field
		 * @param {string} label The name of the label
		 */
		this.selected.labelIt = function(label) {
			this.node.id = "fb" + label.toUpperCase().replace(/[^\w\s ]/gi, '').replace(/ /g, '').substr(0, 8);
			this.form.label(label, this.node);
		}

		/**
		 * Attach an event of *eventType* type and call *callback* when its trigged
		 * @param {string} eventType The event type
		 * @param {function} callback The callback when the event is trigged
		 * @return {selected} selected 
		 */
		this.selected.on = function(eventType, callback) {
			this.form.Event().addEvent(this.node, eventType, callback);
			return this;
		}

		return this;
	};


	/**
	 * Constructor of Form
	 * @return {Form} Form the instance
	 */
	FormBuilder.prototype.Form = function() {
		
		/**
		 * Configure the form
		 * @param {object} options Overrides options
		 */
		this.configure = function(options) {
			this.options.form = this.options.form.merge(options);
		}

		/**
		 * Return the form element with their fields
		 * @return {object} form The form
		 */
		this.get = function() {
			var form = document.createElement('form');
			form.setAttributes(this.options.form);

			var that = this;
			form.onsubmit = function(evt) {
				that.onSubmit(evt, that.fields.filter(function(e) { return e.name; } ).map(function(el) {
						var response = {
							field : el, 
							value : (el.value == 'undefined') ? '' : el.value,
							name : el.name
						}

						return response;
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


	/**
	 * Constructor of Validator
	 * @return {Validator} Validator the instance
	 */
	FormBuilder.prototype.Validator = function() {
		// TODO

		return this;
	};


	/**
	 * Constructor of Event
	 * @return {Event} Event the instance
	 */
	FormBuilder.prototype.Event = function() {
		this.timer = null;

		this.events = ['writing', 'afterwriting', 'keypress', 'keydown', 'keyup', 'focus', 'blur', 'click', 'dblclick'];

		/**
		 * Adds an event to a field
		 * @param {object} element The element to attach the event
		 * @param {string} evtType The type of event
		 * @param {function} callback The callback
		 */
		this.addEvent = function(element, evtType, callback) {
			if(this.events.indexOf(evtType) >= 0) {
				if(typeof element['on' + evtType] == "undefined") {
					switch(evtType) {
						case 'writing':
							this.addEvent(element, 'keyup', callback);
							break;

						case 'afterwriting':
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

	/**
	 * Define the wrapper where the form will be printed
	 * @param {string} wrapperSelector The query selector of the wrapper
	 */
	FormBuilder.prototype.setWrapper = function(wrapperSelector) {
		var element = document.querySelector(wrapperSelector);
		if(element != null)
			this.wrapper = element;
		else
			throw new Error('Wrapper isn\'t found');
	};

	/**
	 * Define the field wrapper
	 * @param {string} tag The html tag wrapper
	 * @param {object} attributes (Optional) The attributes of the field wrapper
	 */
	FormBuilder.prototype.setFieldWrapper = function(tag, attributes) {
		var element = document.createElement(tag);
		if(typeof attributes == 'object')
			element.setAttributes(attributes);

		this.fieldWrap = element;
	};

	/**
	 * Define the behaviour on submit
	 * @param {function} callback The callback
	 * @param {boolean} prevDft Do prevent default or not
	 */
	FormBuilder.prototype.setOnSubmit = function(callback, prevDft) {
		this.onSubmit = callback;
		this.preventDefault = prevDft;
	};
	
	/**
	 * Render the form to the wrapper
	 */
	FormBuilder.prototype.render = function() {
		if(!this.wrapper)
			throw new Error('Wrapper must be defined.');

		var form = this.Form().get();

		for(var i in this.fields) {
			if(this.fields.hasOwnProperty(i)) {
				var f = this.fields[i];
				if(f.name && this.values[f.name] != undefined) {
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

	/**
	 * Apply new attribute of an object
	 * @param {object} attributes Attributes to apply
	 */
	Object.prototype.setAttributes = function(attributes) {
		for(var i in attributes) {
			if(attributes.hasOwnProperty(i)) {
				if(i == "innerContent")
					this.innerHTML = attributes[i];
				else if(i == "class")
					this.setAttribute(i, [this.className, attributes[i]].join(' ').trim());
				else
					this.setAttribute(i, attributes[i]);
			}
		}
		return this;
	}

	/**
	 * Merge the current object with another
	 * @param {object} obj Object to merge
	 */
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
