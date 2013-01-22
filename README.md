stpl
====

really lightweight and simple javascript template system

##supported syntax:

 - single variable parameters: ``{{varname}}``
 - escaped single variable parameters: ``{{{varname}}}``
 - if syntax: ``{{varname?}}varname as a value{{?varname}}``
 - if not syntax ``{{varname!?}}varname as a value{{?varname}}``
 - loop through each elements ``{{#elements}}<li>{{propname}}</li>{{/elements}}``
 - support dotted notation ``{{childs.length}}``
 - can even include sub templates ``{{>subTemplateName}}``
 - filtering properties dynamicly ``{{firstname|ucFirst}}``

## methods:
 - stpl.registerScriptTag(DOMelment scriptTag,[String name (default to rel attribute value)]) register the content of a script type="text/stpl" as a template string
 - stpl.registerString(String name, String templateString) register a string as a template
 - stpl.registerFilter(String name,Function filter) register a filter any global function can be used as a filter without being previously registered
 - stpl.preload() preload all script tags with type="text/stpl" as template string using their rel attribute as name.
 - stpl.renderString(String templateString,Object datas,Object context) render the given template string using given datas. A context may be passed ans will be used for accessing parent properties for example
 - stpl(String templateName, Object datas) will render previously registered template string with given datas
