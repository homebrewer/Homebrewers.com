/* **************************************************************

   Copyright 2011 Zoovy, Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

************************************************************** */

/*
An extension for acquiring and displaying 'lists' of categories.
The functions here are designed to work with 'reasonable' size lists of categories.
*/


var store_navcats = function() {
	var r = {
	vars : {},

					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		


//calls return a 0 if a request is made and a 1 if data is already local.
	calls : {
//formerly categoryTree
		appCategoryList : {
			init : function(tagObj,Q)	{
//				app.u.dump("BEGIN store_navcats.calls.appCategoryList.init");
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				if(app.model.fetchData('appCategoryList') == false)	{
					r = 1;
					this.dispatch(tagObj,Q);
					}
				else 	{
					app.u.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(tagObj,Q)	{
				obj = {};
				obj['_cmd'] = "appCategoryList";
				obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
				obj['_tag'].datapointer = 'appCategoryList'; //for now, override datapointer for consistency's sake.
//if no extension is set, use this one. need to b able to override so that a callback from outside the extension can be added.
				obj['_tag'].extension = obj['_tag'].extension ? obj['_tag'].extension : 'store_navcats'; 
				app.model.addDispatchToQ(obj,Q);
				}
			}, //appCategoryList

/*
a typical 'fetchData' is done for a quick determination on whether or not ANY data for the category is local.
if not, we're obviously missing what's needed.  If some data is local, check for the presence of the attributes
requested and if even one isn't present, get all.
datapointer needs to be defined early in the process so that it can be used in the handlecallback, which happens in INIT.
obj.PATH = .cat.safe.id
*/
		appPageGet : {
			init : function(obj,tagObj,Q)	{
				obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
				obj['_tag'].datapointer = 'appPageGet|'+obj.PATH;  //no local storage of this. ### need to explore solutions.
				var r = 0;
				var hasAllLocal = true;
				if(app.model.fetchData('appPageGet|'+obj.PATH) == false)	{
					hasAllLocal = false;
					}
				else	{
					var L = obj['@get'].length;
					for(var i = 0; i < L; i += 1)	{
						if(!app.data['appPageGet|'+obj.PATH]['%page'][obj['@get'][i]])	{
							hasAllLocal = false;
							break; //once we know 1 piece of data is missing, just get all of it.
							}
						}
					}
				if(hasAllLocal)	{
					app.u.handleCallback(tagObj);
					}
				else	{
					this.dispatch(obj,tagObj,Q);
					r = 1;
					}
				return r;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj['_cmd'] = "appPageGet";
				app.model.addDispatchToQ(obj,Q);
				}
			}, //appPageGet
//formerly categoryDetail
		appCategoryDetail : {
			init : function(catSafeID,tagObj,Q)	{
//			app.u.dump('BEGIN app.ext.store_navcats.calls.appCategoryDetail.init ('+catSafeID+')');
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
//whether max, more or just detail, always save to same loc.
//add here so if tagObj is passed directly into callback because data is in localStorage, the datapointer is set.
				tagObj.datapointer = 'appCategoryDetail|'+catSafeID;
				if(app.model.fetchData(tagObj.datapointer) == false)	{
					r += 1;
					this.dispatch(catSafeID,tagObj,Q);
					}
				else 	{
//					app.u.dump(' -> using local');
					app.u.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(catSafeID,tagObj,Q)	{
//				app.u.dump('BEGIN app.ext.store_navcats.calls.appCategoryDetail.dispatch');
				var catSafeID;
				app.model.addDispatchToQ({"_cmd":"appCategoryDetail","safe":catSafeID,"detail":"fast","_tag" : tagObj},Q);	
				}
			},//appCategoryDetail

		appCategoryDetailMore : {
			init : function(catSafeID,tagObj,Q)	{
//				app.u.dump('BEGIN app.ext.store_navcats.calls.appCategoryDetailMore.init');
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
				tagObj.datapointer = 'appCategoryDetail|'+catSafeID;
				if(app.model.fetchData(tagObj.datapointer) == false)	{
//nothing is local. go get it.
					this.dispatch(catSafeID,tagObj,Q);
					r += 1;
					}
				else	{
//something is in local. if max or more, use it.
					if(app.data[tagObj.datapointer].detail == 'max'  || app.data[tagObj.datapointer].detail == 'more')	{
						app.u.handleCallback(tagObj)
						}
					else 	{
//local is probably from a 'fast' request. go get more.
						this.dispatch(catSafeID,tagObj,Q);
						r += 1;
						}
					}
				return r;
				},
			dispatch : function(catSafeID,tagObj,Q)	{
				var catSafeID;
				tagObj.datapointer = 'appCategoryDetail|'+catSafeID; //whether max, more or just detail, always save to same loc.
				tagObj.detail = 'more'; //if detail is in tabObj, model will add it to data object.
				app.model.addDispatchToQ({"_cmd":"appCategoryDetail","safe":catSafeID,"detail":"more","_tag" : tagObj},Q);	
				}
			},//appCategoryDetailMore




		appCategoryDetailMax : {
			init : function(catSafeID,tagObj,Q)	{
//				app.u.dump('BEGIN app.ext.store_navcats.calls.appCategoryDetailMax.init');
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
//whether max, more or just detail, always save to same loc.
//add here so if tagObj is passed directly into callback because data is in localStorage, the datapointer is set.
				tagObj.datapointer = 'appCategoryDetail|'+catSafeID;
//				app.u.dump(' -> datapointer = '+tagObj.datapointer);
				
				if(app.model.fetchData(tagObj.datapointer) == false)	{
//					app.u.dump(' -> data is not local. go get it.');
					r += 1;
					this.dispatch(catSafeID,tagObj,Q);
					}
				else	{
					if(app.data[tagObj.datapointer].detail == 'max')	{
						app.u.handleCallback(tagObj);
						}
					else 	{
						r += 1;
						this.dispatch(catSafeID,tagObj,Q);
						}
					}
				return r;
				},
			dispatch : function(catSafeID,tagObj,Q)	{
//				app.u.dump(' -> safeid = '+catSafeID);
//				app.u.dump(' -> executing dispatch.');
				tagObj.detail = 'max';
				app.model.addDispatchToQ({"_cmd":"appCategoryDetail","safe":catSafeID,"detail":"max","_tag" : tagObj},Q);	
				}
			}//appCategoryDetailMax

		}, //calls









					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.store_navcats.init.onSuccess ');
				return true;  //currently, no system or config requirements to use this extension
//				app.u.dump('END app.ext.store_navcats.init.onSuccess');
				},
			onError : function()	{
				app.u.dump('BEGIN app.ext.store_navcats.callbacks.init.onError');
				}
			},

		getRootCatsData : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN app.ext.store_navcats.callbacks.handleProduct.onSuccess");
				app.ext.store_navcats.u.getRootCatsData(tagObj);
				}
			},
/*
cats that start with a ! in the 'pretty' name are 'hidden'.  However, the pretty name isn't available until appCategoryDetail is request.
appCategoryDetail is requested AFTER a DOM element is already created for each category in the specified tree.  This is necessary because some data is loaded from local storage (fast)
and some has to be requested (not as fast). To maintain the correct order, the DOM element is added, then populated as info becomes available.
in this case, the DOM element may not be necessary, and in those cases (hidden cat), it is removed.

params in addition to standard tagObj (datapointer, callback, etc).

templateID - the template id used (from app.templates)
*/
		addCatToDom : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN app.ext.store_navcats.callbacks.addCatToDom.onSuccess");
//				app.u.dump(" -> datapointer = "+tagObj.datapointer);
//				app.u.dump(" -> add data to template: "+tagObj.parentID+"_"+tagObj.datapointer.split('|')[1]);
//yes, actually have to make sure .pretty exists. no shit. this happeneed. errored cuz pretty wasn't set.
				if(app.data[tagObj.datapointer].pretty && app.data[tagObj.datapointer].pretty.charAt(0) !== '!')	{
//					app.u.dump("store_navcats.callback.addCatToDom.onsuccess - Category ("+tagObj.datapointer+") is hidden.");
					app.renderFunctions.translateTemplate(app.data[tagObj.datapointer],tagObj.parentID+"_"+tagObj.datapointer.split('|')[1]);
					}
				else	{
//					app.u.dump(" -> cat '"+app.data[tagObj.datapointer].pretty+"' is hidden. nuke it!");
					$('#'+app.u.makeSafeHTMLId(tagObj.parentID+"_"+tagObj.datapointer.split('|')[1])).empty().remove();
					}
				}
			},


//to display a category w/ thumbnails, first the parent category obj is fetched (appCategoryDetail...) and this would be the callback.
//it will get the detail of all the children, including 'meta' which has the thumbnail. It'll absorb the tag properties set in the inital request (parent, template) but
// override the callback, which will be set to simply display the category in the DOM. getChildDataOf handles creating the template instance as long as parentID and templateID are set.
		getChildData : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.myRIA.callbacks.getChildData.onSuccess');
				var catSafeID = tagObj.datapointer.split('|')[1];
//				app.u.dump(" -> catsafeid: "+catSafeID);
				tagObj.callback = 'addCatToDom'; //the tagObj will have 
				app.ext.store_navcats.u.getChildDataOf(catSafeID,tagObj,'appCategoryDetail');  //generate nav for 'browse'. doing a 'max' because the page will use that anway.
				app.model.dispatchThis();
				}
			} //getChildData


		}, //callbacks







////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		renderFormats : {


			numSubcats : function($tag,data){
//					app.u.dump('BEGIN store_navcats.renderFormats.numSubcats');
					$tag.append(data.value.length);
				}, //numSubcats

			numProduct : function($tag,data){
//					app.u.dump('BEGIN store_navcats.renderFormats.numProduct');
					$tag.append(data.value.length);
				}, //numSubcats



//assumes that you have already gotten a 'max' detail for the safecat specified data.value.
//shows the category, plus the first three subcategories.
			subcategory2LevelList : function($tag,data)	{
//				app.u.dump("BEGIN store_navcats.renderFormats.subcatList");
				var catSafeID; //used in the loop for a short reference.
				var subcatDetail = data.value;
				var o = '';
				if(!$.isEmptyObject(subcatDetail))	{
					var L = subcatDetail.length;
					var size = L > 15 ? 15 : L; //don't show more than 15.
//!!! hhhmm.. needs fixin. need to compensate 'i' for hidden categories.
					for(var i = 0; i < size; i +=1)	{
						if(subcatDetail[i].pretty[0] != '!')	{
							catSafeID = subcatDetail[i].id;
							o += "<li><a href='#' onClick=\"showContent('category',{'navcat':'"+catSafeID+"'}); return false;\">"+subcatDetail[i].pretty+ "<\/a><\/li>";
							}
						}
					if(L > size)	{
						o += "<li class='viewAllSubcategories' onClick=\"showContent('category',{'navcat':'"+data.value+"'});\">View all "+L+" Categories<\/li>";
						}
					$tag.append(o);
					}		
				}, //subcategory2LevelList		

//pass in category safe id as value
			breadcrumb : function($tag,data)	{
//app.u.dump("BEGIN store_navcats.renderFunctions.breadcrumb"); app.u.dump(data);
var numRequests = 0; //number of requests (this format may require a dispatch to retrieve parent category info - when entry is a page 3 levels deep)
var TID = data.bindData.loadsTemplate; //Template ID
//on a category page, the catsafeid is the value. on a product page, the value is an array of recent categories, where 0 is always the most recent category.
var path = typeof(data.value) == 'object' ? data.value[0] : data.value;
if(path)	{
	var pathArray = path.split('.');
	var L = pathArray.length;
	var s = '.'
	var catSafeID; //recycled in loop for path of category in focus during iteration.
	
//	app.u.dump(" -> path: "+path);
	//app.u.dump(" -> TID: "+TID);
	//app.u.dump(pathArray);
	//app.u.dump(" -> L: "+L);
	//make sure homepage has a pretty.  yes, it sometimes happens that it doesn't.
	if(!app.data['appCategoryDetail|.'].pretty)
		app.data['appCategoryDetail|.'].pretty = 'Home';
	
	$tag.append(app.renderFunctions.transmogrify({'id':'.','catsafeid':'.'},data.bindData.loadsTemplate,app.data['appCategoryDetail|.']));
// homepage has already been rendered. if path == ., likely we r on a product page, arriving from homepage. don't show bc.
	if(path == '.'){}
	else	{
		for(i = 1; i < L; i += 1)	{
			s += pathArray[i];
		//	app.u.dump(" -> "+i+" s(path): "+s);
			$tag.append(app.renderFunctions.transmogrify({'id':'.','catsafeid':s},data.bindData.loadsTemplate,app.data['appCategoryDetail|'+s]));
			s += '.';
			}
		}
	

	
}
				} //breadcrumb

			}, //renderFormats


////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
/*
In cases where the root categories are needed, this function will return them from the appCategoryList dataset.
function assumes appCategoryList already exists in memory.
will return an object of id:safeid, which is how the categories are stored in a appCategoryDetail.
the formatted is specific so that getChildDataOf can be used for a specific id or '.' so don't change the output without testing it in that function.
*/
			getRootCats : function()	{
//				app.u.dump('BEGIN app.ext.store_navcats.u.getRootCats');
				var r = false;
				if(app.data.appCategoryList)	{
					var L = app.data.appCategoryList['@paths'].length;
					r = new Array();
	//				app.u.dump(' -> num cats = '+L);
					for(var i = 0; i < L; i += 1)	{
						if(app.data.appCategoryList['@paths'][i].split('.').length == 2)	{
							r.push(app.data.appCategoryList['@paths'][i]);
							}
						}
					}
				return r;
				}, //getRootCatsData


/*
a function for obtaining information about a categories children.
assumes you have already retrieved data on parent so that @subcategories or @subcategoryDetail is present.
 -> catSafeID should be the category safe id that you want to obtain information for.
 -> call, in all likelyhood, will be set to one of the following:  appCategoryDetailMax, appCategoryDetailMore, appCategoryDetailFast.  It'll default to Fast.
tagObj is optional and would contain an object to be passed as _tag in the request (callback, templateID, etc).
if the parentID and templateID are passed as part of tagObj, a template instance is created within parentID.

note - This function just creates the calls.  Dispatch on your own.
note - there is NO error checking in here to make sure the subcats aren't already loaded. Do that in a parent function on your own.
 (see examples/site-analyzer/ actions.showSubcats

*/
			getChildDataOf : function(catSafeID,tagObj,call){
				var numRequests = 0; //will get incremented once for each request that needs dispatching.
//				app.u.dump("BEGIN app.ext.store_navcats.u.getChildDataOf ("+catSafeID+")");
//				app.u.dump(app.data['appCategoryDetail|'+catSafeID])
//if . is passed as catSafeID, then tier1 cats are desired. The list needs to be generated.
				var catsArray = new Array(); 
				var newParentID;
				var tier = (catSafeID.split('.').length) - 1; //root cat split to 2, so subtract 1.
				if(catSafeID == '.')
					catsArray = this.getRootCats();
				else if(app.data['appCategoryDetail|'+catSafeID] && typeof app.data['appCategoryDetail|'+catSafeID]['@subcategories'] == 'object')	{
					catsArray = app.data['appCategoryDetail|'+catSafeID]['@subcategories'];
//					app.u.dump("GOT HERE for "+catSafeID);
					}
//when a max detail is done for appCategoryDetail, subcategories[] is replaced with subcategoryDetail[] in which each subcat is an object.
				else if(typeof app.data['appCategoryDetail|'+catSafeID]['@subcategoryDetail'] == 'object' && !$.isEmptyObject(app.data['appCategoryDetail|'+catSafeID]['@subcategoryDetail']))	{
					catsArray = this.getSubsFromDetail(catSafeID);
					}
				else	{
					//most likely, category doesn't have subcats.
					}
				
				if(catsArray.length > 0)	{
					
					catsArray.sort(); //sort by safe id.
					var L = catsArray.length;
					var call = call ? call : "appCategoryDetail"
	//				app.u.dump(" -> tier = "+tier);
	//				app.u.dump(" -> parentID = "+tagObj.parentID);
	//				app.u.dump(" -> call = "+call);
	//				app.u.dump(" -> # subcats = "+L);
	//used in the for loop below to determine whether or not to render a template. use this instead of checking the two vars (templateID and parentID)
					renderTemplate = false;
					if(tagObj.templateID && tagObj.parentID)	{
						var $parent = $('#'+tagObj.parentID);
						var renderTemplate = true;
						}
	//				app.u.dump(" -> parentid.length: "+$parent.length);
	//				app.u.dump(" -> renderTemplate: "+renderTemplate);
	
					for(var i = 0; i < L; i += 1)	{
						if(renderTemplate)	{
	//homepage is skipped. at this point we're dealing with subcat data and don't want 'homepage' to display among them
							if(catsArray[i] != '.')	{
	//							app.u.dump(" -> createTemplateInstance for: "+catsArray[i]);
								newParentID = tagObj.parentID+"_"+catsArray[i]
								$parent.append(app.renderFunctions.createTemplateInstance(tagObj.templateID,{"id":newParentID,"catsafeid":catsArray[i]}));
								}
							}
	//if tagObj was passed in without .extend, the datapointer would end up being shared across all calls.
	//I would have though that manipulating tagObj within another function would be local to that function. apparently not.
						numRequests += app.ext.store_navcats.calls[call].init(catsArray[i],$.extend({'parentID':newParentID},tagObj));
						}
	//				app.u.dump(' -> num requests: '+numRequests);
					}
				return numRequests;
				}, //getChildDataOf

//on a appCategoryDetail, the @subcategoryDetail contains an object. The data is structured differently than @subcategories.
//this function will return an array of subcat id's, formatted like the value of 
			getSubsFromDetail : function(catSafeID)	{

var catsArray = new Array(); //what is returned. incremented with each dispatch created.
var L = app.data['appCategoryDetail|'+catSafeID]['@subcategoryDetail'].length
for(var i = 0; i < L; i += 1)	{
	catsArray.push(app.data['appCategoryDetail|'+catSafeID]['@subcategoryDetail'][i].id);
	}
//app.u.dump(catsArray);
return catsArray;			
				}, //getSubsFromDetail
			
						
			addQueries4BreadcrumbToQ : function(path)	{
//				app.u.dump("BEGIN myRIA.u.getBreadcrumbData");
				var numRequests = 0;
				var pathArray = path.split('.');
				var len = pathArray.length
				var s= '.'; //used to contatonate safe id.
				numRequests += app.ext.store_navcats.calls.appCategoryDetail.init('.'); //homepage data. outside of loop so I can keep loop more efficient
				for (var i=1; i < len; i += 1) {
					s += pathArray[i]; //pathArray[0] will be blank, so s (.) plus nothing is just .
//					app.u.dump(" -> path for breadcrumb: "+s);
					numRequests += app.ext.store_navcats.calls.appCategoryDetail.init(s);
				//after each loop, the . is added so when the next cat id is appended, they're concatonated with a . between. won't matter on the last loop cuz we're done.
					s += "."; //put a period between each id. do this first so homepage data gets retrieved.
					
					}
				return numRequests;
				}			
			
			
			} //util


		
		} //r object.
	return r;
	}