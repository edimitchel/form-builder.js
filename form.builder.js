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
		validateForm : true,
		prefixGeneratedId : 'fb',
		maxLengthGeneratedId : 10,
		createId : function(name){
			var s = name.toLowerCase().replace(/[^\w\s ]/gi, '').replace(/ /g, '');
			return (this.prefixGeneratedId + s.charAt(0).toUpperCase() + s.substr(1)).substr(0, this.maxLengthGeneratedId);
		},
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
		'input' : document.createElement('INPUT'),
		'textarea' : document.createElement('TEXTAREA'),
		'button' : document.createElement('BUTTON'),
		'label' : document.createElement('LABEL'),
		'option' : document.createElement('OPTION'),
		'select' : document.createElement('SELECT'),
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
		this.field = function(type, nameOrOptions, addToStream) {
			var field = FormBuilder.getField(type);
			if(typeof nameOrOptions == "string" || typeof nameOrOptions == "undefined") {
				FormBuilder.setAttribute(field, 'name', nameOrOptions);
			} else if(typeof nameOrOptions == "object") {
				field.setAttributes(nameOrOptions);

				if(nameOrOptions.hasOwnProperty('childrens')){
					for(var i  = 0; i < nameOrOptions.childrens.length; i++)
						field.appendChild(nameOrOptions.childrens[i]);
				}
			}

			this.selected.node = field;

			return addToStream == undefined || addToStream == true ? this.addElement(field) : field;
		}

		/**
		 * update a field
		 * @param {string} type Type of field
		 * @param {string|object} nameOrOptions Name or attributes of the field
		 * @return {object} field The added field 
		 */
		this.updateField = function(name, attributes) {
			if(this.fields[this.indexOf(name)].isArray()){
				return this.fields[this.indexOf(name)].filter(function(e){
					return e.name;
				})[0];
			} else {

				if(typeof attributes == "object") {
					this.fields[this.indexOf(name)].setAttributes(attributes);

					if(attributes.hasOwnProperty('childrens'))
						for(var i  = 0; i < attributes.childrens.length; i++)
							this.fields[this.indexOf(name)].appendChild(attributes.childrens[i]);
				}

				return this.fields[this.indexOf(name)];
			}
		}

		/**
		 * Retrieve the index of the desired field
		 * @param {string} name Name of field
		 * @return {int} index Index of the desired field 
		 */
		this.indexOf = function(name) {
			for(var i = 0; i < this.fields.length; i++){
				var f = this.fields[i];
				if(f.isArray()){
					f = f.filter(function(e){
						return e.name;
					})[0];
				}

				if(f.name == name)
					return i;
			} 
			return -1;
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
				this.fields[ind] = [
					label,
					this.fields[ind]
				];
				//this.fields.splice(ind, 0, label);
			} else {
				var tA = this;
				field.check = function(){
					return tA.check(this);
				};

				this.fields.push(field);
			}
			return field;
		}

		/**
		 * Adds an input element to the list of fields
		 * @param {string} type The type of input (text, mail, number, etc.)
		 * @param {string|object} nameOrOptions Name or attributes of the field
		 * @return {object} field The added input field 
		 */
		this.input = function(type, nameOrOptions) {
			var input;
			if(type != undefined) {
				if(typeof nameOrOptions == 'string') {
					nameOrOptions = {
						name: nameOrOptions,
						type: type
					}
				} else if(typeof nameOrOptions == 'object') {
					nameOrOptions.type = type;
				}
			}

			input = this.field('input', nameOrOptions);

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
		 * Adds a select element to the list of fields
		 * @param {string|object} nameOrOptions Name or attributes of the field
		 * @param {object} options Options available to the select
		 * @return {object} field The added select field 
		 */
		this.select = function(nameOrOptions, options) {
			var optionsList = [];
			for(var i in options){
				if(options.hasOwnProperty(i)){
					optionsList.push(this.option(i, options[i]).node);
				}
			}

			if(nameOrOptions.isString()){
				nameOrOptions = {
					name : nameOrOptions
				};
			}

			nameOrOptions.childrens = optionsList;
			var select = this.field('select', nameOrOptions);

			return this.selected;
		}


		/**
		 * Adds a option element to the list of fields
		 * @param {string} name Name or attributes of the field
		 * @param {string} value Value or attributes of the field
		 * @return {object} field The added option field 
		 */
		this.option = function(name, value) {
			var option = this.field('option', {
				innerHTML: value,
				value: name
			}, false);

			return this.selected;
		}


		/**
		 * Adds a button element to the list of fields
		 * @param {string|object} nameOrOptions Name or attributes of the field
		 * @return {object} field The added button field 
		 */
		this.button = function(title, nameOrOptions) {
			var button = this.field('button', nameOrOptions);
			FormBuilder.setAttribute(button, 'innerHTML', title);
			
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
			FormBuilder.setAttribute(labelNode, 'innerHTML', label);
			FormBuilder.setAttribute(labelNode, 'for', field.id);
			return this.addElement(field, labelNode);
		}


		/**
		 * Use in chaine, to add a label to a field
		 * @param {string} label The name of the label
		 */
		this.selected.labelIt = function(label) {
			this.node.id = this.form.options.createId(label);
			this.form.label(label, this.node);

			return this;
		}

		/**
		 * Select value on a select field
		 * @param {string|array} value Value|s to select
		 */
		this.selected.selectValue = function(value) {
			if(arguments.length > 2){
				var values = [];
				for(var i = 1; i < arguments.length; i++){
					values.push(arguments[i]);
				}

				var childrens = [].slice.call(this.node.children);

				while(this.node.firstChild != null)
					this.node.removeChild(0);

				for(var i = 0; i < childrens.length; i++){
					if(values.indexOf(childrens[i].value) >= 0) {
						childrens[i].selected = selected;
					}
					this.node.appendChild(childrens[i]);
				}

			} else {
				var ind = [].slice.call(this.node.children).map(function(e){ return e.value; }).indexOf(value);

				this.form.updateField(this.node.name).children[ind].selected = "selected";				
			}

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


		/**
		 * Check *element* if its valid.
		 * @param {object} element
		 * @return {object} validationObj The validation object with some useful information
		 */
		this.check = function(element){
			var validationObj = {
				valid : null,
				message : null
			};

			switch(element.nodeName){
				case 'INPUT':
				case 'TEXTAREA':
					if(element.pattern != undefined && element.pattern != null){
						var r = new RegExp(element.pattern).test(element.value);
						return r;
					}
					break;
				case 'OPTION':

					break;
			}

			return validationObj;
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
				var filt = function(e) { 
					return e.name || e.isArray(); 
				};

				var map = function(el) {
					if(el.isArray()){
						el = el.filter(function(e){
							return e.name;
						})[0];
					}

					var response = {
						field : el, 
						value : (el.value == 'undefined') ? '' : el.value,
						name : el.name
					};
					return response;
				};

				that.onSubmit(evt, that.fields.filter(filt).map(map));

				if(that.options.validateForm){
					that.Validator().process();
				}

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
		this.valid = true;
		this.errors = [];

		this.process = function() {
			var valid = true;
			var filt = function(e){
				return e.check && e.nodeName != 'BUTTON';
			}
			for(var i = 0; i < this.fields.filter(filt).length; i++) {
				var v = this.fields.filter(filt)[i].check();
				console.log(this.fields.filter(filt)[i].check());
				if(!v.valid){
					this.valid = false;
					this.errors.push({
						field : this.fields[i],
						message : v.message
					})
				}
			}
			this.valid = valid;
		}

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

		FormBuilder.renderFields(this, this.fields, form);

		this.wrapper.appendChild(form);
	};

	FormBuilder.renderFields = function(formInstance, list, form, wrap){
		wrap = wrap == undefined ? true : wrap;
		
		for(var i = 0; i < list.length; i ++) {
			var fldWrap;
			if(list[i] != "undefined") {
				if(formInstance.fieldWrap != undefined) {
					if(wrap){
						fldWrap = formInstance.fieldWrap.cloneNode();
					}
				}

				if(!list[i].isArray()) {
					var f = list[i];
					if(f.name && formInstance.values[f.name] != undefined) 
						f.setAttribute('value', formInstance.values[f.name]);

					if(wrap)
						fldWrap.appendChild(f);
					else 
						fldWrap = f;

				} else {
					FormBuilder.renderFields(formInstance, list[i], fldWrap, false);
				}
			}
			form.appendChild(fldWrap);
		}
	}

	/**
	 * Apply new attributes of an object
	 * @param {object} attributes Attributes to apply
	 */
	Object.prototype.setAttributes = function(attributes) {
		for(var i in attributes) {
			if(attributes.hasOwnProperty(i)) {
				FormBuilder.setAttribute(this, i, attributes[i]);
			}
		}
		return this;
	}

	/**
	 * Apply new attribute of an object
	 * @param {object} obj Object involved 
	 * @param {string} name Name of the attribute
	 * @param {object} value Value of the attribute
	 */
	FormBuilder.setAttribute = function(obj, name, value) {
		if(value != undefined){
			if(name == "innerHTML")
				obj.innerHTML = value;
			else if(name == "childrens")
				obj.childrens = value;
			else if(name == "class")
				obj.setAttribute(name, [obj.className, value].join(' ').trim());
			else
				obj.setAttribute(name, value);
		}
		return obj;
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

	Object.prototype.isArray = function(){
		return Object.prototype.toString.call(this).indexOf('Array') >= 0;
	}

	Object.prototype.isString = function(){
		return typeof this == 'string';
	}

	context.FormBuilder = FormBuilder;

})(this);
