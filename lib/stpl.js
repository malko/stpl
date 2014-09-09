/**
* small template libraray
* known limitations: don't support nesting of same tags
* @author Jonathan Gotti for modedemploi
* @licence MIT
* @changelog
*            - 2014-08-29 - add support for "as" when looping through items
*            - 2013-04-14 - add support for filter parameters
*                         - expose tplType to allow external settings
*                         - allow '-' in template names
*            - 2012-12-27 - add [in]equality filters + upperCase,lowerCase,ucFirst
*                         - better context management
*                         - add support for partial inclusion
*            - 2012-12-   - now if/ifnot  both support ending tags with or whithout filters includes so {{param|empty?}}{{?param|empty}} is no equivalent to {{param|empty?}}{{?param}}
*/
(function(exports){
	/*global global,exports*/
	/*jshint strict:true,expr:true,evil:true,validthis:true,white:false,laxcomma:true,forin:false, -W052*/
	"use strict";
	var length='length'
		,replace='replace'
		,getAttribute='getAttribute'
		,substr='substr'

		// minification optimisations
		,tplStrings = {}
		,registeredFilters = {
			//built-in filters:  |=value, |!=value (filters can now take parameters separated by : and each separated by commas)
			empty:function(v){ return !!((!v) || v==='0' || ( (v instanceof Array) && ! v[length] )); }
			,jsonEncode:function(v){ return JSON.stringify(v); }
			,lowerCase:function(v){ return v.toString().toLowerCase();}
			,ucFirst:function(v){ v = v.toString(); return v[substr](0,1).toUpperCase()+v[substr](1);}
			,upperCase:function(v){ return v.toString().toUpperCase();}
			,nl2br:function(v){ return v.toString().replace(/\n/g,'<br />');}
		}
		, escapedchars={ "&": "&amp;" ,"<": "&lt;" ,">": "&gt;" ,'"': "&quot;" ,"'": "&#x27;" ,"`": "&#x60;" }
		, G = (typeof global !== 'undefined') ? global : (new Function('return this;'))()
	;
	function escaped(str){
		return str[replace](/[<>"'`]|&(?!amp;)/g,function(m){ return escapedchars[m];});
	}
	function registerString(tplName,tplStr){
		tplStrings[tplName] = tplStr[replace](/^\s+|\s+$/g,'');
		return this;
	}
	function registerScriptTag(scriptTag,name){
		registerString(name || scriptTag[getAttribute]('rel'),scriptTag.innerHTML);
		scriptTag.parentNode.removeChild(scriptTag);
		return this;
	}
	function registerFilter(filterName,filterMethod){
		registeredFilters[filterName] = filterMethod || G[filterName];
		return this;
	}
	function preload(){
		var tplScripts,i,d=document;
		if( d.querySelectorAll ){
			tplScripts = d.querySelectorAll('script[type="'+stpl.tplType+'"][rel]');
		}else{
			var tmp = d.getElementsByTagName('script');
			for( i=tmp[length],tplScripts=[]; i--;){
				tmp[i][getAttribute]('type') === stpl.tplType && tmp[i][getAttribute]('rel') && tplScripts.push(tmp[i]);
			}
		}
		for( i = tplScripts[length];i--;){
			registerScriptTag(tplScripts[i]);
		}
		return this;
	}

	function getDataKey(datas,key,context){
		var i,l;
		if( ~key.indexOf('|') ){
			var filters=key.split('|'), data, filterParams, filterSep;
			key = filters.shift();
			data = getDataKey(datas,key,context);
			for(i=0,l=filters[length];i<l;i++){
				if( filters[i].match(/^\s*!?=/) ){/*jshint eqeqeq:false,loopfunc:true*/
					filters[i][replace](/^\s*(!?)=(.*)\s*$/,function(m,not,val){
						data = not ? (data!=val?data:false) : (data==val?data:false);
					});
				}else{
					if( !~(filterSep = filters[i].indexOf(':')) ){
						filterParams = [data];
					}else {
						(filterParams = filters[i][substr](filterSep+1).split(',')).splice(0,0,data);
						filters[i] = filters[i][substr](0,filterSep);
					}
					registeredFilters[filters[i]] ||  registerFilter(filters[i]);
					data = registeredFilters[filters[i]].apply(datas,filterParams);
				}
			}
			return data;
		}
		if(key.match(/^\//)){
			key=key[substr](1);
			context='';
		}
		while(key.match(/^..\//)){
			context = (~context.indexOf('.'))?'':context[replace](/\.[^\.]*$/,'');
			key = key[replace](/^..\//,'');
		}
		key = key[replace](/^\.+/,'');
		context = context[replace](/^\/+/,'')[replace](/^\.+/,''); // clean up context
		key = ((context||'')+(context && key?'.':'')+key);
		if(! key[length]){
			return datas;
		}
		key = key.split(/\s*\.\s*/);
		var res = datas;
		for(i=0,l=key[length];i<l;i++){
			if(! (typeof res === 'object' && (key[i] in res)) ){
				return null;
			}
			res=res[key[i]];
		}
		return res;
	}
	function render(str,datas,context){
		context || (context='');
		return str
			[replace](/\{\{\s*#([^\{\s]+?)(?:\s+as\s+([^\{\s]+?))?\}\}([\s\S]*?)\{\{\/\1\}\}/g,function(m,param,as,str){ // each elements #param ending /param
				var res = []
					, data = getDataKey(datas, param, context)
					, hadInData=false
					, asData, oldAs, nContext, i
				;
				if(! data ){ return '';}
				if( !as ){
					nContext = (context?context+'.':'')+param;
					for( i in data ){
						data.hasOwnProperty(i) && res.push(render(str,datas,nContext+'.'+i));
					}
					return res.join('');
				}
				asData = data;
				data = getDataKey(datas, '', context);
				if(! data ){ return '';}
				if( as in data){
					hadInData=true;
					oldAs = data[as];
				}
				for( i in asData ){
					data[as] = asData[i];
					asData.hasOwnProperty(i) && res.push(render(str,datas,context));
				}
				if( hadInData ){
					data[as] = oldAs;
				} else {
					delete data[as];
				}
				return res.join('');
			})
			[replace](/\{\{\s*(([^\{\s\|]+?)(\|[^\{\s]+?)?)\s*(!)?\?\s*\}\}([\s\S]*?)\{\{\s*\?\s*(\1|\2)\s*\}\}/g,function(m,fullParam,param,filters,not,str){ // if => param?  if not => param!? both ending with ?param (filters may be ommitted for ending tag)
				var data = getDataKey(datas,fullParam,context);
				var paramTrue = (!data)? false : (data instanceof Array ? data[length]: true);
				not && (paramTrue = !paramTrue);
				return paramTrue ? render(str,datas,context) : '';
			})
			[replace](/\{\{\s*>\s*([a-z_][a-z_0-9-]*)\s*\}\}/ig,function(m,subTpl){
				if(! tplStrings[subTpl]){
					return '';
				}
				return render(tplStrings[subTpl],datas,context);
			})
			[replace](/\{\{\{\s*([^\{\s]*?)\s*\}\}\}/g,function(m,id){ // triple stash for escaped replacement
				return escaped(getDataKey(datas,id,context));
			})
			[replace](/\{\{\s*([^\{\s]*?)\s*\}\}/g,function(m,id){ return getDataKey(datas,id,context);}) // double stash for normal replacement
		;
	}
	function stpl(name,datas){
		if( tplStrings[name] === undefined){
			preload();
			if( tplStrings[name] === undefined){
				return false;
			}
		}
		return render(tplStrings[name],datas);
	}
	stpl.tplType = 'text/stpl';
	stpl.registerScriptTag = registerScriptTag;
	stpl.registerString = registerString;
	stpl.registerFilter = function(name,filter){registerFilter(name,filter); return this;};
	stpl.preload= preload;
	stpl.renderString=render;
	exports.stpl = stpl;
})((typeof exports === 'object') ? exports : this);
