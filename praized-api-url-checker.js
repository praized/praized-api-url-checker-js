/* PraizedAPIURLChecker 0.1
 *
 *  IMPORTANT: This is not iron-clad, and should remain relaxed in the sense that:
 *  
 *  	- A URL considered as VALID by this tool CAN in fact be invalid (gotcha alert: when true isn't always so)
 *  	- A URL that is considered invalid for the API MUST be flagged as invalid by this tool 
 *  .. in other words: this should be reflected in tests (not included within this file).
 * 
 *
 * Author: Francois Lafortune
 * Copyright (c) 2010 PraizedMedia Inc. 
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function(){
	// Regular Expressions to match path parts, mostly pulled from praized lib in rails app
	var RE = {
		host: /^api(\.dev)?.praized.com$/,
		slug: /^[a-zA-Z_-][a-zA-Z\d_-]+$/,
		resource: /^(actions|merchants|users|questions|answers|communities|favorites|votes|comments|search|realtime_items|replies|checkins|shares|friends|location|settings|avatar|broadcast_services|action_types)$/,
		pid: /^[a-f0-9]{32,34}$/i,
		login: /^[a-zA-Z_-][a-zA-Z\d_-]+$/,
		tag:/^[a-z[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]\s\d-]{2,20}$/
	},
	// grabs a param value from a url or returns false if not present
	param = function(url,name){
		var key = url.indexOf(name);
		if(key < 0) return false;			
		var end = (end = url.indexOf('&',key)) == -1 ? url.length : end;
		var val = url.slice(key+name.length+1,end);
		return (val ? (val == '' ? false : val) : false);
	},
	// takes a param-provided community slug and sticks it in the path parts
	normalizeParts = function(url,parts){
		// normalize path parts to include slug if slug passed as parameter
		if(RE.resource.test(parts[1])) parts.splice(1,0,param(url,'community_slug'));
		return parts;
	};
	// the public interface
	this.PraizedAPIURLChecker = {
		check: function(url){
			var path,params,api_key,messages=[],valid = true;
			// extracts the path part of a url
			path = ((path = url.match(/(?:http\:\/\/|\/)?([^\?\#]+)/)) ? path[1].replace(/\.json|\.xml/,'') : false);
			if(!path || (path && RE.host.test(path))){
				// should have at least a community_slug or a resource path part in case of 
				// community slug sent as param, emptiness is erroneous.
				messages.push('Community slug or resource missing.');
				valid = false;	
			}else{
				params = ((params = url.match(/\?([^\#]+)/)) ? params[1] : false);
				// should have at least an api_key parameter
				if(!params){
					messages.push('Api Key Missing.');
					valid = false;
				}else{
					var parts = normalizeParts(url,path.split('/'));
					// validate host part if present
					if(parts[0] && !RE.host.test(parts[0])){
						messages.push('Host is not valid');
						valid = false;	
					};
					// validate community_slug if present
					if(parts[1] && !RE.slug.test(parts[1])){
						messages.push('Community Slug is not valid');
						valid = false;				
					};
					switch(parts[2]){
						case 'users': 
						// validate resource part if present					
						if(parts[2] && !RE.resource.test(parts[2])){
							messages.push('Resource is not valid');
							valid = false;				
						};
						// validate resource pid part if present										
						if(parts[3] && !RE.login.test(parts[3])){
							messages.push('Login is not valid');
							valid = false;				
						};
						break;
						default:
						// validate resource part if present					
						if(parts[2] && !RE.resource.test(parts[2])){
							messages.push('Resource is not valid');
							valid = false;				
						};
						// validate resource pid part if present										
						if(parts[3] && !RE.pid.test(parts[3])){
							messages.push('PID is not valid');
							valid = false;				
						};
						break;
					};
					if(parts[4] && !RE.resource.test(parts[4])){
						messages.push('Nested resource is not valid');
						valid = false;				
					};
					if(parts[5] && !RE.pid.test(parts[5])){
						messages.push('Nested resource pid is not valid');
						valid = false;				
					};
					if(!(api_key = param(url,'api_key'))){
						messages.push('Api Key Missing.');
						valid = false;
					}else{
						if(!RE.pid.test(api_key)){
							messages.push('Api Key Illegal.');
							valid = false;		
						};
					};
				};
			};
			// set/reset messages
			this.messages = valid ? [] : messages ;
			return valid;
		}
	};
})();
