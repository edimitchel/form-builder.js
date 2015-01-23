;(function(context, builder){
    builder.editDefaultField({
        class: 'form-control'
    }, ['input', 'textarea', 'select']);

    builder.editDefaultField('button', {
        class: 'btn btn-default'
    });
}(window, FormBuilder));