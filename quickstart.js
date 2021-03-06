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





var myRIA = function() {
	var r = {
		
	vars : {
//a list of the templates used by this extension.
//if this is a custom extension and you are loading system extensions (prodlist, etc), then load ALL templates you'll need here.
		"templates" : [
//the list of templates that are commonly edited (same order as they appear in appTemplates
			'homepageTemplate',	'categoryTemplate',
			'categoryListTemplate',
			'categoryListTemplateRootCats',
			'productListTemplate',
			'productListTemplateATC',
			'productListTemplateBuyerList',
			'productListTemplateResults',
			'productTemplate',
			'productTemplateQuickView',
			'pageNotFoundTemplate',
//the list of templates that, in most cases, are left alone. Also in the same order as appTemplates
			'breadcrumbTemplate',
			'companyTemplate',
			'customerTemplate',
			'searchTemplate',
			'mpControlSpec',
			'cartTemplate',
			'productListTemplateCart',
			'productListTemplateChildren',
			'productReviewsTemplateDetail',
			'imageViewerTemplate',
			'reviewFrmTemplate',
			'subscribeFormTemplate',
			'orderLineItemTemplate',
			'orderContentsTemplate',
			'productListTemplateInvoice',
			'faqTopicTemplate',
			'faqQnATemplate',
			'billAddressTemplate',
			'shipAddressTemplate'],
		"session" : {
			"recentSearches" : [],
			"recentlyViewedItems" : [],
			"recentCategories" : []
			},
		"dependAttempts" : 0,  //used to count how many times loading the dependencies has been attempted.
		"dependencies" : ['store_prodlist','store_navcats','store_product','store_search','store_cart','store_crm','convertSessionToOrder','store_checkout'] //a list of other extensions (just the namespace) that are required for this one to load
		},


					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {

		}, //calls




					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	callbacks : {
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
//				app.u.dump('BEGIN app.ext.myRIA.callbacks.init.onError');
				}
			},

		startMyProgram : {
			onSuccess : function()	{
//			app.u.dump("BEGIN myRIA.callback.startMyProgram");
//			app.u.dump(" -> window.onpopstate: "+typeof window.onpopstate);
//			app.u.dump(" -> window.history.pushState: "+typeof window.history.pushState);
//This will create the arrays for the template[templateID].onCompletes and onInits
			app.ext.myRIA.u.createTemplateFunctions(); //should happen early so that the myRIA.template object exists, specifically for app.u..appInitComplete
				
//attach an event to the window that will execute code on 'back' some history has been added to the history.
//if ?debug=anything is on URI, show all elements with a class of debug.
if(app.u.getParameterByName('debug'))	{
	$('.debug').show().append("<div class='clearfix'>Model Version: "+app.model.version+" and release: "+app.vars.release+"</div>");
	app.ext.myRIA.u.bindAppViewForms('.debug');
	app.ext.myRIA.u.bindNav('.debug .bindByAnchor');
	}
if(typeof window.onpopstate == 'object')	{
	window.onpopstate = function(event) { 
		app.ext.myRIA.u.handlePopState(event.state);
		}
	}
//if popstate isn't supporeted, hashchange will use the anchor.
else if ("onhashchange" in window)	{ // does the browser support the hashchange event?
		_ignoreHashChange = false; //global var. when hash is changed from JS, set to true. see handleHashState for more info on this.
		window.onhashchange = function () {
		app.ext.myRIA.u.handleHashState();
		}
	}
else	{
	app.u.throwMessage("You appear to be running a very old browser. Our app will run, but may not be an optimal experience.");
	// wow. upgrade your browser. should only get here if older than:
	// Google Chrome 5, Safari 5, Opera 10.60, Firefox 3.6 and Internet Explorer 8 
	}





//get list of categories and append to DOM IF parent id exists
				app.ext.store_navcats.calls.appCategoryList.init({"callback":"showRootCategories","extension":"myRIA"},'passive');
//get homepage info passively. do it later so that if it is already requested as part of another process, no double request occurs.
//no need to dispatch it because passive dispatch runs on a setInterval.
				setTimeout(function(){
					app.ext.store_navcats.calls.appCategoryDetailMax.init('.',{},'passive');
					},7000); //throw this into the q to have handy. do it later 
				
				if(app && app.u && typeof app.u.appInitComplete == 'function'){app.u.appInitComplete()}; //gets run prior to any page content so that it can be used to add renderformats of template functions.

				var page = app.ext.myRIA.u.handleAppInit(); //checks url and will load appropriate page content. returns object {pageType,pageInfo}

//get some info to have handy for when needed (cart, profile, etc)
				app.calls.appProfileInfo.init(app.vars.profile,{},'passive');

				if(page.pageType == 'cart' || page.pageType == 'checkout')	{
//if the page type is determined to be the cart or checkout onload, no need to request cart data. It'll be requested as part of showContent
					}
				else	{
					app.calls.refreshCart.init({'callback':'updateMCLineItems','extension':'myRIA'},'passive');
					app.ext.store_cart.calls.cartShippingMethods.init({},'passive');
					}

				app.model.dispatchThis('passive');


//adds submit functionality to search form. keeps dom clean to do it here.
				app.ext.myRIA.u.bindAppViewForms();
				app.ext.myRIA.vars.mcSetInterval = setInterval(app.ext.myRIA.u.handleMinicartUpdate,4000,'cartItemsList')
				showContent = app.ext.myRIA.a.showContent; //a shortcut for easy execution.
				quickView = app.ext.myRIA.a.quickView; //a shortcut for easy execution.
				
				app.ext.myRIA.u.bindNav('#appView .bindByAnchor');
//not sure why this was here. think it was to test something. commented out on 2012-09-13
//app.ext.store_checkout.checkoutCompletes.push(function(P){
//	app.u.dump("WOOT! to to checkoutComplete");
//	app.u.dump(P);
//	})
				
				$('.disableAtStart').removeAttr('disabled').removeAttr('disableAtStart'); //set disabledAtStart on elements that should be disabled prior to init completing.

				}
			}, //startMyProgram 



		itemAddedToCart :	{
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.store_product.callbacks.itemAddedToCart.onSuccess');
				$('.atcButton').removeAttr('disabled').removeClass('disabled'); //makes all atc buttons clickable again.
				
				var msgObj = app.u.successMsgObject('Item Added')
				msgObj.parentID = 'atcMessaging_'+app.data[tagObj.datapointer].product1
				var htmlid = app.u.throwMessage(msgObj);
				setTimeout(function(){
					$("#"+htmlid).slideUp(1000);
					},5000);
			
				_gaq.push(['_trackEvent','Add to cart','User Event','success',app.data[tagObj.datapointer].product1]);
			
				},
			onError : function(responseData,uuid)	{
				app.u.dump('BEGIN app.ext.myRIA.callbacks.itemAddedToCart.onError');
//				app.u.dump(responseData);
				$('.addToCartButton').removeAttr('disabled').removeClass('disabled').removeClass('ui-state-disabled'); //remove the disabling so users can push the button again, if need be.
				responseData.parentID = 'atcMessaging_'+responseData.product1
				app.u.throwMessage(responseData);
				_gaq.push(['_trackEvent','Add to cart','User Event','fail',app.data[tagObj.datapointer].product1]);
				}
			}, //itemAddedToCart
			
//optional callback  for appCategoryList in app init which will display the root level categories in element w/ id: tier1categories 
		showRootCategories : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.myRIA.callbacks.showCategories.onSuccess');
				var tagObj = {};
//we always get the tier 1 cats so they're handy, but we only do something with them out of the get if necessary (tier1categories is defined)
				if($('#tier1categories').length)	{
					tagObj = {'parentID':'tier1categories','callback':'addCatToDom','templateID':'categoryListTemplateRootCats','extension':'store_navcats'}
					}
				app.ext.store_navcats.u.getChildDataOf('.',tagObj,'appCategoryDetailMax');  //generate nav for 'browse'. doing a 'max' because the page will use that anway.
				app.model.dispatchThis();
				}
			}, //showRootCategories

//used for callback on showCartInModal function
//
		handleCart : 	{
			onSuccess : function(tagObj)	{
				app.u.dump("BEGIN myRIA.callbacks.onSuccess.handleCart");
				app.ext.myRIA.u.handleMinicartUpdate(tagObj);
				//empty is to get rid of loading gfx.
				$('#'+tagObj.parentID).empty().append(app.renderFunctions.transmogrify('modalCartContents',tagObj.templateID,app.data[tagObj.datapointer].cart));
				tagObj.state = 'onCompletes'; //needed for handleTemplateFunctions.
				app.ext.myRIA.u.handleTemplateFunctions(tagObj);
				}
			}, //updateMCLineItems

//used in init.
		updateMCLineItems : 	{
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN myRIA.callbacks.updateMCLineItems");
				app.ext.myRIA.u.handleMinicartUpdate(tagObj);
				}
			}, //updateMCLineItems

		showProd : 	{
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN myRIA.callbacks.showProd");
//				app.u.dump(tagObj);
				var tmp = app.data[tagObj.datapointer];
				var pid = app.data[tagObj.datapointer].pid;
				tmp.session = app.ext.myRIA.vars.session;
				if(typeof app.data['appReviewsList|'+pid] == 'object')	{
					tmp['reviews'] = app.ext.store_product.u.summarizeReviews(pid); //generates a summary object (total, average)
					tmp['reviews']['@reviews'] = app.data['appReviewsList|'+pid]['@reviews']
					}
//				if(pid == 'AXA-TEST-B2')	{app.u.dump(tmp)}
				app.renderFunctions.translateTemplate(tmp,tagObj.parentID);
				tagObj.pid = pid;
				app.ext.myRIA.u.buildQueriesFromTemplate(tagObj);
				app.model.dispatchThis();
				
// SANITY - handleTemplateFunctions does not get called here. It'll get executed as part of showPageContent callback, which is executed in buildQueriesFromTemplate.
				},
			onError : function(responseData,uuid)	{
//				app.u.dump(responseData);
				$('#mainContentArea').empty();
				app.u.throwMessage(responseData);
				}
			}, //showProd 


		showCompany : 	{
			onSuccess : function(tagObj)	{
				app.renderFunctions.translateTemplate(app.data[tagObj.datapointer],tagObj.parentID);
				app.ext.myRIA.u.bindNav('#companyNav a');
				app.ext.myRIA.u.showArticle(tagObj.infoObj);
				if(!tagObj.infoObj.templateID)	{
					if(tagObj.infoObj.templateID){} //use existing value
					else if(tagObj.templateID)	{tagObj.infoObj.templateID = 'companyTemplate'}
					else	{tagObj.infoObj.templateID = 'companyTemplate'}
					}
				tagObj.infoObj.state = 'onCompletes';
				app.ext.myRIA.u.handleTemplateFunctions(tagObj.infoObj);				
				}
			}, //showCompany 




		handleBuyerAddressUpdate : 	{
			onSuccess : function(tagObj)	{
				app.u.dump("BEGIN myRIA.callbacks.handleBuyerAddressUpdate");
//				app.u.dump(tagObj);
				$parent = $('#'+tagObj.parentID);
				$('button',$parent).removeAttr('disabled').removeClass('ui-state-disabled');
				$('.changeLog',$parent).empty().append('Changes Saved');
				$('.edited',$parent).removeClass('edited'); //if the save button is clicked before 'exiting' the input, the edited class wasn't being removed.
				$('.buttonMenu',$parent).find('.offMenu').show();
				$('.buttonMenu',$parent).find('.onMenu').hide();
				app.ext.myRIA.u.destroyEditable($parent);
				},
			onError : function(responseData,uuid)	{
				var $parent = $('#'+tagObj.parentID);
				$('.changeLog',$parent).append(app.u.formatResponseErrors(responseData))
				$('button',$parent).removeAttr('disabled').removeClass('ui-state-disabled');
				}
			}, //handleBuyerAddressUpdate

//used in /customer
		showAddresses : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN myRIA.callbacks.showAddresses.onSuccess");
//clean the workspace.
				var authState = app.u.determineAuthentication();
				$('#buyerAddresses .shipAddresses, #buyerAddresses .billAddresses, ').empty(); //empty no matter what, so if user was logged in and isn't, addresses go away.
				var $buyerAddresses; //recycled. use as target for bill and ship addresses. the target of this changes in the loop below
//only show addresses if user is logged in.
				if(authState == 'authenticated')	{
					var types = new Array('@ship','@bill');
					var L,type;
//yes, it's a loop inside a loop.  bad mojo, i know.
//but there's only two types of addresses and, typically, not a lot of addresses per user.
					for(var j = 0; j < 2; j += 1)	{
						type = types[j];
						$buyerAddresses = $("."+type.substring(1)+"Addresses",$('#buyerAddresses'))
						app.u.dump(" -> address type: "+type);
//						app.u.dump(app.data.buyerAddressList[type]);
						L = app.data.buyerAddressList[type].length;
//						app.u.dump(" -> # addresses: "+L);
						if(L)	{
//							$buyerAddresses.append(type == '@bill' ? '<h2>Billing Address(es)</h2>' : '<h2>Shipping Address(es)</h2>');
							var addressClass = type == '@bill' ? 'BILL' : 'SHIP';
							for(var i = 0; i < L; i += 1)	{
								$buyerAddresses.append(app.renderFunctions.transmogrify({
									'id':addressClass+'_address_'+app.data.buyerAddressList[type][i]['_id'], //_id may not be unique between classes, so class is part of ID (ex: DEFAULT)
									'addressclass': addressClass, //appBuyerAddressAddUpdate wants this as UC w/ no @
									'addressid':app.data.buyerAddressList[type][i]['_id']
									},type.substring(1)+'AddressTemplate',app.data.buyerAddressList[type][i]))
								} //for loop for addresses
							}// L if
						} //for loop for address types

					$('button',$('#buyerAddresses')).each(function(){
						var $button = $(this);
						if($button.data('action') == 'cancelAddressChanges'){
							$button.click(function(){
								$button.closest('.buttonMenu').find('.offMenu').show();
								$button.closest('.buttonMenu').find('.onMenu').hide();
								var $parent = $button.closest('.buyerAddressContainer');
								app.ext.myRIA.u.destroyEditable($parent);
								});
							} //if for cancelAddressChanges
							
						else if($button.data('action') == 'saveAddressChanges'){
							$button.click(function(){
								var $parent = $(this).closest('.buyerAddressContainer');
//								alert($('.edited',$parent).length)
								var cmdObj = app.ext.myRIA.u.getAllDataFromEditable($parent);
								if(!$.isEmptyObject(cmdObj))	{
									$('button',$parent).addClass('ui-state-disabled').attr('disabled','disabled');
									cmdObj.shortcut = $parent.attr('data-addressid');
									cmdObj.type = $parent.attr('data-addressclass');
//									app.u.dump(" -> cmdObj: "); app.u.dump(cmdObj);
									$('.changeLog',$parent).append("<div class='alignRight'><span class='wait'></span><span>Saving</span></div>");
									app.ext.store_crm.calls.buyerAddressAddUpdate.init(cmdObj, {'callback':'handleBuyerAddressUpdate','extension':'myRIA','parentID':$parent.attr('id')},'immutable');
									app.model.dispatchThis('immutable')
									}
								else	{
									$('.changeLog',$parent).empty().append("<div>no changes have been made</div>");
									}
								});
							} //else if for saveAddressChanges
							
						else if($button.data('action') == 'displayOnMenu')	{
							$button.click(function(){
								$(this).closest('.buttonMenu').find('.offMenu').hide();
								$(this).closest('.buttonMenu').find('.onMenu').show();
								app.ext.myRIA.u.makeRegionEditable($(this).closest('.buyerAddressContainer'));
								});
							} //else if for displayOnMenu
						else	{
							app.u.dump("WARNING! unknown data-action set on customer address button");
							}
						})
					}
				}
			}, //showAddresses

//used as part of showContent for the home and category pages.
		fetchPageContent : {
			onSuccess : function(tagObj)	{
				var catSafeID = tagObj.datapointer.split('|')[1];
				tagObj.navcat = catSafeID;
				app.ext.myRIA.u.buildQueriesFromTemplate(tagObj);
				app.model.dispatchThis();
				},
			onError : function(responseData)	{
				app.u.throwMessage(responseData);
				$('.loadingBG',$('#mainContentArea')).removeClass('loadingBG'); //nuke all loading gfx.
				app.ext.myRIA.u.changeCursor('auto'); //revert cursor so app doesn't appear to be in waiting mode.
				}
			}, //fetchPageContent


//used as part of showContent for the home and category pages.
		showPageContent : {
			onSuccess : function(tagObj)	{
//when translating a template, only 1 dataset can be passed in, so detail and page are merged and passed in together.
				var tmp = {};
//cat page handling.
				if(tagObj.navcat)	{
					if(typeof app.data['appCategoryDetail|'+tagObj.navcat] == 'object' && !$.isEmptyObject(app.data['appCategoryDetail|'+tagObj.navcat]))	{
						tmp = app.data['appCategoryDetail|'+tagObj.navcat]
						}
					if(typeof app.data['appPageGet|'+tagObj.navcat] == 'object' && typeof app.data['appPageGet|'+tagObj.navcat]['%page'] == 'object' && !$.isEmptyObject(app.data['appPageGet|'+tagObj.navcat]['%page']))	{
						tmp['%page'] = app.data['appPageGet|'+tagObj.navcat]['%page'];
						}
					tmp.session = app.ext.myRIA.vars.session;
//a category page gets translated. A product page does not because the bulk of the product data has already been output. prodlists are being handled via buildProdlist
					app.renderFunctions.translateTemplate(tmp,tagObj.parentID);
					}
//product page handline
				else if(tagObj.pid)	{
// the bulk of the product translation has already occured by now (attribs, reviews and session) via callbacks.showProd.
// product lists are being handled through 'buildProductList'.
					}
				else	{
					app.u.dump("WARNING! showPageContent has no pid or navcat defined");
					}

				var L = tagObj.searchArray.length;
				var $parent;
				for(var i = 0; i < L; i += 1)	{
					$parent = $('#'+tagObj.searchArray[i].split('|')[1]);
					app.ext.myRIA.renderFormats.productSearch($parent,{value:app.data[tagObj.searchArray[i]]});
					}
				tagObj.state = 'onCompletes'; //needed for handleTemplateFunctions.
				app.ext.myRIA.u.handleTemplateFunctions(tagObj);

				},
			onError : function(responseData,uuid)	{
				$('#mainContentArea').removeClass('loadingBG')
				app.u.throwMessage(responseData);
				}
			}, //showPageContent

//this is used for showing a customer list of product, such as wish or forget me lists
		showBuyerLists : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.myRIA.showList.onSuccess ');
var $parent = $('#'+tagObj.parentID).removeClass('loadingBG');
if(app.data[tagObj.datapointer]['@lists'].length > 0)	{
	var $ul = app.ext.store_crm.u.getBuyerListsAsUL(tagObj.datapointer);
	var numRequests = 0;
	$ul.children().each(function(){
		var $li = $(this);
		var listID = $li.data('buyerlistid');
		$li.wrapInner("<a href='#"+listID+"Contents'></a>"); //adds href for tab selection
		$parent.append($("<div>").attr({'id':listID+'Contents','data-buyerlistid':listID}).append($("<ul>").addClass('listStyleNone clearfix noPadOrMargin lineItemProdlist').attr('id','prodlistBuyerList_'+listID))); //containers for list contents and ul for productlist
		numRequests += app.ext.store_crm.calls.buyerProductListDetail.init(listID,{'callback':'buyerListAsProdlist','extension':'myRIA','parentID':'prodlistBuyerList_'+listID})
		});
	$parent.prepend($ul).tabs();
	app.model.dispatchThis('mutable');
	}
else	{
	$parent.append("You have no lists at this time. Add an item to your wishlist to get started...");
	}
				}
			}, //showBuyerList



//this is used for showing a customer list of product, such as wish or forget me lists
//formerly showlist
		buyerListAsProdlist : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.myRIA.showList.onSuccess ');
				var listID = tagObj.datapointer.split('|')[1];
				var prods = app.ext.store_crm.u.getSkusFromBuyerList(listID);
				if(prods.length < 1)	{
//list is empty.
					app.u.formatMessage('This list ('+listID+') appears to be empty.');
					}
				else	{
//					app.u.dump(prods);
					app.ext.store_prodlist.u.buildProductList({"templateID":"productListTemplateBuyerList","withInventory":1,"withVariations":1,"parentID":tagObj.parentID,"csv":prods,withInventory:1,withReviews:1,withVariations:1})
					app.model.dispatchThis();
					}
				}
			}, //showList

//a call back to be used to show a specific list of product in a specific element.
//requires templateID and targetID to be passed on the tag object.
		showProdList : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN myRIA.callbacks.showProdList");
//				app.u.dump(app.data[tagObj.datapointer]);
				if(app.data[tagObj.datapointer]['@products'].length < 1)	{
					$('#'+tagObj.targetID).append(app.u.formatMessage('This list ('+listID+') appears to be empty.'));
					}
				else	{
					app.ext.store_prodlist.u.buildProductList({"templateID":tagObj.templateID,"parentID":tagObj.targetID,"csv":app.data[tagObj.datapointer]['@products']})
					app.model.dispatchThis();
					}
				}
			}, //showList
		authenticateZoovyUser : {
			onSuccess : function(tagObj)	{
				app.vars.cid = app.data[tagObj.datapointer].cid; //save to a quickly referencable location.
				$('#loginSuccessContainer').show(); //contains 'continue' button.
				$('#loginMessaging').empty().show().append("Thank you, you are now logged in."); //used for success and fail messaging.
				$('#loginFormContainer').hide(); //contains actual form.
				$('#recoverPasswordContainer').hide(); //contains password recovery form.
				}
			} //authenticateZoovyUser

		}, //callbacks



////////////////////////////////////   WIKILINKFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

/*
the wiki translator has defaults for the links built in. however, these will most likely
need to be customized on a per-ria basis.
*/
		wiki : {
			":search" : function(suffix,phrase){
				return "<a href='#' onClick=\"return showContent('search',{'KEYWORDS':'"+suffix+"'}); \">"+phrase+"<\/a>"
				},
			":category" : function(suffix,phrase){
				return "<a href='#category?navcat="+suffix+"' onClick='return showContent(\"category\",{\"navcat\":\""+suffix+"\"});'>"+phrase+"<\/a>"
				},
			":product" : function(suffix,phrase){
				return "<a href='#product?pid="+suffix+"' onClick='return showContent(\"product\",{\"pid\":\""+suffix+"\"});'>"+phrase+"<\/a>"
				},
			":customer" : function(suffix,phrase){
// ### this needs to get smarter. look at what the suffix is and handle cases. (for orders, link to orders, newsletter link to newsletter, etc)				
				return "<a href='#customer?show="+suffix+"' onClick='return showContent({\"customer\",{\"show\":\""+suffix+"\"});'>"+phrase+"<\/a>"
				}
			}, //wiki




////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		renderFormats : {

//This function works in conjuction with the fetchPageContent and showPageContent functions.
//the parent and subcategory data (appCategoryDetail) must be in memory already for this to work right.
//data.value is the category object. data.bindData is the bindData obj.
			subcategoryList : function($tag,data)	{
//				app.u.dump("BEGIN control.renderFormats.subcats");
//				app.u.dump(data.value);
				var L = data.value.length;
				var thisCatSafeID; //used in the loop below to store the cat id during each iteration
	//			app.u.dump(data);
				for(var i = 0; i < L; i += 1)	{
					thisCatSafeID = data.value[i].id;
					if(data.value[i].id[1] == '$')	{
						//ignore 'lists', which start with .$
//						app.u.dump(" -> list! "+data.value[i].id);
						}
					else if(!data.value[i].pretty || data.value[i].pretty.charAt(0) == '!')	{
						//categories that start with ! are 'hidden' and should not be displayed.
						}
					else if(!$.isEmptyObject(app.data['appCategoryDetail|'+thisCatSafeID]))	{
						$tag.append(app.renderFunctions.transmogrify({'id':thisCatSafeID,'catsafeid':thisCatSafeID},data.bindData.loadsTemplate,app.data['appCategoryDetail|'+thisCatSafeID]));
						}
					else	{
						app.u.dump("WARNING - subcategoryList reference to appCategoryDetail|"+thisCatSafeID+" was an empty object.");
						}
					}
				}, //subcategoryList

//if first char is a !, hide that char, then render as text. used in breadcrumb
//likely to be used in prodcats if/when it's built.s
			catText : function($tag,data)	{
				if(data.value[0] == '!')	{data.value = data.value.substring(1)}
				app.renderFormats.text($tag,data)
				},

//### later, we could make this more advanced to actually search the attribute. add something like elasticAttr:prod_mfg and if set, key off that.
			searchLink : function($tag,data){
				var keywords = data.value.replace(/ /g,"+");
				$tag.append("<span class='underline pointer'>"+data.value+"<\/span>").bind('click',function(){
					showContent('search',{'KEYWORDS':keywords})
					});
				}, //searchLink


			addPicSlider : function($tag,data)	{
				app.u.dump("BEGIN myRIA.renderFormats.addPicSlider: "+data.value);
				if(typeof app.data['appProductGet|'+data.value] == 'object')	{
					var pdata = app.data['appProductGet|'+data.value]['%attribs'];
//if image 1 or 2 isn't set, likely there are no secondary images. stop.
					if(app.u.isSet(pdata['zoovy:prod_image1']) && app.u.isSet(pdata['zoovy:prod_image2']))	{
						$tag.attr('data-pid',data.value); //no params are passed into picSlider function, so pid is added to tag for easy ref.
//						app.u.dump(" -> image1 ["+pdata['zoovy:prod_image1']+"] and image2 ["+pdata['zoovy:prod_image2']+"] both are set.");
//adding this as part of mouseenter means pics won't be downloaded till/unless needed.
// no anonymous function in mouseenter. We'll need this fixed to ensure no double add (most likely) if template re-rendered.
//							$tag.unbind('mouseenter.myslider'); // ensure event is only binded once.
							$tag.bind('mouseenter.myslider',app.ext.myRIA.u.addPicSlider2UL).bind('mouseleave',function(){window.slider.kill()})
						}
					}
				},

			youtubeThumbnail : function($tag,data)	{
				$tag.attr('src',"https://i3.ytimg.com/vi/"+data.value+"/default.jpg");
				return true;
				}, //legacyURLToRIA

// used for a product list of an elastic search results set. a results object and category page product list array are structured differently.
// when using @products in a categoryDetail object, use productList as the renderFormat
// this function gets executed after the request has been made, in the showPageContent response. for this reason it should NOT BE MOVED to store_search
// ## this needs to be upgraded to use app.ext.store_search.u.getElasticResultsAsJQObject
			productSearch : function($tag,data)	{
//				app.u.dump("BEGIN myRIA.renderFormats.productSearch");
				data.bindData = app.renderFunctions.parseDataBind($tag.attr('data-bind'));
//				app.u.dump(data);
				
				var parentID = $tag.attr('id');
				var L = data.value.hits.hits.length;
				var templateID = data.bindData.loadsTemplate ? data.bindData.loadsTemplate : 'productListTemplateResults';
				var pid;
				for(var i = 0; i < L; i += 1)	{
					pid = data.value.hits.hits[i]['_id'];
					$tag.append(app.renderFunctions.transmogrify({'id':parentID+'_'+pid,'pid':pid},templateID,data.value.hits.hits[i]['_source']));
					}
				
				if(data.bindData.before) {$tag.before(data.bindData.before)} //used for html
				if(data.bindData.after) {$tag.after(data.bindData.after)}
				if(data.bindData.wrap) {$tag.wrap(data.bindData.wrap)}		
				},

/*
data.value in a banner element is passed in as a string of key value pairs:
LINK, ALT and IMG
The value of link could be a hash (anchor) or a url (full or relative) so we try to guess.
fallback is to just output the value.
*/

			banner : function($tag, data)	{
//				app.u.dump("begin myRIA.renderFormats.banner");
				var obj = app.u.getParametersAsObject(decodeURI(data.value)); //returns an object LINK, ALT and IMG
				var hash; //used to store the href value in hash syntax. ex: #company?show=return
				var pageInfo = {};
				
				
//				app.u.dump(" -> obj.LINK: "+obj.LINK);
				
//if value starts with a #, then most likely the hash syntax is being used.
				if(obj.LINK && obj.LINK.indexOf('#') == 0)	{
					hash = obj.LINK;
					pageInfo = app.ext.myRIA.u.getPageInfoFromHash(hash);
					}
// Initially attempted to do some sort of validating to see if this was likely to be a intra-store link.
//  && data.value.indexOf('/') == -1 || data.value.indexOf('http') == -1 || data.value.indexOf('www') > -1
				else if(obj.LINK)	{
					pageInfo = app.ext.myRIA.u.detectRelevantInfoToPage(obj.LINK);
					if(pageInfo.pageType)	{
						hash = app.ext.myRIA.u.getHashFromPageInfo(pageInfo);
						}
					else	{
						hash = obj.LINK
						}
					}
				else	{
					//obj.link is not set
					}
				if(!app.u.isSet(obj.IMG))	{$tag.remove()} //if the image isn't set, don't show the banner. if a banner is set, then unset, val may = ALT=&IMG=&LINK=
 				else	{
//if we don't have a valid pageInfo object AND a valid hash, then we'll default to what's in the obj.LINK value.
					$tag.attr('alt',obj.ALT);
//if the link isn't set, no href is added. This is better because no 'pointer' is then on the image which isn't linked.
					if(obj.LINK)	{
//						app.u.dump(" -> obj.LINK is set: "+obj.LINK);
						var $a = $("<a />").addClass('bannerBind').attr({'href':hash,'title':obj.ALT});
						if(pageInfo && pageInfo.pageType)	{
							$a.click(function(){
								return showContent('',pageInfo)
								})
							}
						$tag.wrap($a);
						}
					data.value = obj.IMG; //this will enable the image itself to be rendered by the default image handler. recycling is good.
					app.renderFormats.imageURL($tag,data);
					}
				}, //banner
				
//could be used for some legacy upgrades that used the old textbox/image element combo to create a banner.
			legacyURLToRIA : function($tag,data)	{
				if(data.value == '#')	{
					$tag.removeClass('pointer');
					}
				else	{
					var pageInfo = app.ext.myRIA.u.detectRelevantInfoToPage(data.value);
					pageInfo.back = 0;
					$tag.addClass('pointer').click(function(){
						return app.ext.myRIA.a.showContent('',pageInfo);
						});
					}
				}, //legacyURLToRIA


//pass in the sku for the bindata.value so that the original data object can be referenced for additional fields.
// will show price, then if the msrp is MORE than the price, it'll show that and the savings/percentage.
			priceRetailSavingsDifference : function($tag,data)	{
				var o; //output generated.
				var pData = app.data['appProductGet|'+data.value]['%attribs'];
	//use original pdata vars for display of price/msrp. use parseInts for savings computation only.
				var price = Number(pData['zoovy:base_price']);
				var msrp = Number(pData['zoovy:prod_msrp']);
				if(price > 0 && (msrp - price > 0))	{
					o = app.u.formatMoney(msrp-price,'$',2,true)
					$tag.append(o);
					}
				else	{
					$tag.hide(); //if msrp > price, don't show savings because it'll be negative.
					}
				}, //priceRetailSavings		


//pass in the sku for the bindata.value so that the original data object can be referenced for additional fields.
// will show price, then if the msrp is MORE than the price, it'll show that and the savings/percentage.
			priceRetailSavingsPercentage : function($tag,data)	{
				var o; //output generated.
				var pData = app.data['appProductGet|'+data.value]['%attribs'];
	//use original pdata vars for display of price/msrp. use parseInts for savings computation only.
				var price = Number(pData['zoovy:base_price']);
				var msrp = Number(pData['zoovy:prod_msrp']);
				if(price > 0 && (msrp - price > 0))	{
					var savings = (( msrp - price ) / msrp) * 100;
					o = savings.toFixed(0)+'%';
					$tag.append(o);
					}
				else	{
					$tag.hide(); //if msrp > price, don't show savings because it'll be negative.
					}
				} //priceRetailSavings	
			
			}, //renderFormats



////////////////////////////////////   ACTION [a]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {


//loads page content. pass in a type: category, product, customer or help
// and a page info: catSafeID, sku, customer admin page (ex: newsletter) or 'returns' (respectively to the line above.
// myria.vars.session is where some user experience data is stored, such as recent searches or recently viewed items.
// -> unshift is used in the case of 'recent' so that the 0 spot always holds the most recent and also so the length can be maintained (kept to a reasonable #).
			showContent : function(pageType,infoObj)	{
//				app.u.dump("BEGIN showContent.");
/*
what is returned. is set to true if pop/pushState NOT supported. 
if the onclick is set to return showContent(... then it will return false for browser that support push/pop state but true
for legacy browsers. That means old browsers will use the anchor to retain 'back' button functionality.
*/
				var r = false;
				infoObj.performTransition = infoObj.performTransition || true; //set to true if the link should not tranisition (such as slide to top). used 'my account' in footer linked but login modal displayed. may b set for cart modal or other modals as well.
				if(typeof infoObj != 'object')	{infoObj = {}} //infoObj could be empty for a cart or checkout

//if pageType isn't passed in, we're likely in a popState, so look in infoObj.
				if(pageType){infoObj.pageType = pageType} //pageType
				else if(pageType == '')	{pageType = infoObj.pageType}
				
				infoObj.back = infoObj.back == 0 ? infoObj.back : -1; //0 is no 'back' action. -1 will add a pushState or hash change.

				app.ext.myRIA.u.closeAllModals();  //close any open modal dialogs. important cuz a 'showpage' could get executed via wiki in a modal window.
				//to avoid confusion, clear keywords when leaving a search page. cart opens a modal, so no need to clear.
				if(pageType != 'search' || pageType != 'cart')	{$('.productSearchKeyword').val('');}
				infoObj.state = 'onInits'; //needed for handleTemplateFunctions.

				switch(pageType)	{

					case 'product':
	//add item to recently viewed list IF it is not already in the list.				
						if($.inArray(infoObj.pid,app.ext.myRIA.vars.session.recentlyViewedItems) < 0)	{
							app.ext.myRIA.vars.session.recentlyViewedItems.unshift(infoObj.pid);
							}
						app.ext.myRIA.u.showProd(infoObj);
						break;
	
					case 'homepage':
						infoObj.pageType = 'homepage';
						infoObj.navcat = '.'
						app.ext.myRIA.u.showPage(infoObj);
						break;

					case 'category':
//add item to recently viewed list IF it is not already the most recent in the list.				
//Originally, used: 						if($.inArray(infoObj.navcat,app.ext.myRIA.vars.session.recentCategories) < 0)
//bad mojo because spot 0 in array isn't necessarily the most recently viewed category, which it should be.
						if(app.ext.myRIA.vars.session.recentCategories[0] != infoObj.navcat)	{
							app.ext.myRIA.vars.session.recentCategories.unshift(infoObj.navcat);
							}
						
						app.ext.myRIA.u.showPage(infoObj);
						break;
	
					case 'search':
	//					app.u.dump(" -> Got to search case.");	
						app.ext.myRIA.u.showSearch(infoObj);
						break;
	
					case 'customer':
						if('file:' == document.location.protocol || 'https:' == document.location.protocol)	{
							var showTransition = app.ext.myRIA.u.showCustomer(infoObj);
							infoObj.performTransition = infoObj.performTransition || showTransition;
							}
						else	{
							$('#mainContentArea').empty().addClass('loadingBG').html("<h1>Transferring to Secure Login...</h1>");
							var SSLlocation = app.vars.secureURL+"?sessionId="+app.sessionId;
							SSLlocation += "#customer?show="+infoObj.show
							_gaq.push(['_link', SSLlocation]); //for cross domain tracking.
							document.location = SSLlocation;
							}
						break;
	
					case 'checkout':
//						app.u.dump("PROTOCOL: "+document.location.protocol);

						infoObj.templateID = 'checkoutTemplate'
						infoObj.state = 'onInits'; //needed for handleTemplateFunctions.
						app.ext.myRIA.u.handleTemplateFunctions(infoObj);

//for local, don't jump to secure. !!! discuss w/ b.
						if('file:' == document.location.protocol)	{
							$('#mainContentArea').empty(); //duh.
							app.ext.convertSessionToOrder.calls.startCheckout.init('mainContentArea');
							}
						else if('https:' != document.location.protocol)	{
							app.u.dump(" -> nonsecure session. switch to secure for checkout.");
// if we redirect to ssl for checkout, it's a new url and a pushstate isn't needed, so a param is added to the url.
							$('#mainContentArea').empty().addClass('loadingBG').html("<h1>Transferring you to a secure session for checkout.<\/h1><h2>Our app will reload shortly...<\/h2>");
							var SSLlocation = app.vars.secureURL+"?sessionId="+app.sessionId+"#checkout?show=checkout";
							_gaq.push(['_link', SSLlocation]); //for cross domain tracking.
							document.location = SSLlocation;
							}
						else	{
							$('#mainContentArea').empty(); //duh.
							app.ext.convertSessionToOrder.calls.startCheckout.init('mainContentArea');
							}
						infoObj.state = 'onCompletes'; //needed for handleTemplateFunctions.
						app.ext.myRIA.u.handleTemplateFunctions(infoObj);

						break;
	
					case 'company':
						app.ext.myRIA.u.showCompany(infoObj);
						break;
	
					case 'cart':
//						infoObj.mode = 'modal';
						infoObj.back = 0; //no popstate or hash change since it's opening in a modal.
						infoObj.performTransition = false; //dont jump to top.
//						app.ext.myRIA.u.showPage('.'); //commented out.
						app.ext.myRIA.u.showCart(infoObj);
						break;

					case '404': 	//no specific code. shared w/ default, however a case is present because it is a recognized pageType.
					default:		//uh oh. what are we? default to 404.
						infoObj.pageType = '404';
						infoObj.back = 0;
						infoObj.templateID = 'pageNotFoundTemplate'
						infoObj.state = 'onInits'; //needed for handleTemplateFunctions.
						app.ext.myRIA.u.handleTemplateFunctions(infoObj);

						$('#mainContentArea').empty().append(app.renderFunctions.transmogrify('',infoObj.templateID,infoObj));
						
						r.state = 'onCompletes'; //needed for handleTemplateFunctions.
						app.ext.myRIA.u.handleTemplateFunctions(infoObj);
					}
//					app.u.dump("adding pushstate");
//					app.u.dump(infoObj);
				r = app.ext.myRIA.u.addPushState(infoObj);
				
//r will = true if pushState isn't working (IE or local). so the hash is updated instead.
//				app.u.dump(" -> R: "+r+" and infoObj.back: "+infoObj.back);
				if(r == true && infoObj.back == -1)	{
					var hash = app.ext.myRIA.u.getHashFromPageInfo(infoObj);
//					app.u.dump(" -> hash from infoObj: "+hash);
//see if hash on URI matches what it should be and if not, change. This will only impact browsers w/out push/pop state support.
					if(hash != window.location.hash)	{
						_ignoreHashChange = true; //make sure changing the hash doesn't execute our hashChange code.
						window.location.hash = hash;
						}
					}
//transition appPreView out on init.
				if($('#appPreView').is(':visible'))	{
					$('#appPreView').slideUp(1000,function(){
						$('#appView').slideDown(3000);
						});
					}
//if user is not logged in, don't animate because the login modal won't appear on screen if you do.
				else if(infoObj.performTransition == false)	{}
				else	{
					$('html, body').animate({scrollTop : 0},200); //new page content loading. scroll to top.
					}

				return false; //always return false so the default action (href) is cancelled. hashstate will address the change.
				}, //showContent

/*
add as an action to a button.
First check to see if item is purchaseable. If not, jump to product detail page. could be that inventory/variations weren't retrieved or that the item is a parent.
If item has variations, will go to detail page.
if item has no variations and does have inventory, will add to cart.
supports same actions as default add to cart.
assumes product record is in memory.
*/
/*
			add2CartOrDetails : function(sku,P)	{
P.pageType = 'product';
P.pid = sku;
if(sku && app.data['appProductGet|'+sku])	{
	if(app.ext.store_product.u.productIsPurchaseable(sku))	{
		if(app.data['appProductGet|'+sku]['@variations'] && $.isEmptyObject(app.data['appProductGet|'+sku]['@variations'])	{showContent(P);} //either variations weren't retrieved or item HAS variations. 
		else if(){}
	else	{
//for some reason, the item isn't purchaseable. could be that it's a parent, that variations or inventory haven't been retrieved. jump to detail page.
		showContent(P);
		}
	}
else	{
	app.u.throwMessage("Oops. It seems we weren't quite ready for you to do that or the developer made a mistake. Please try again momentarily and if the error persists, please let us know. <br />err: sku ["+sku+"] not passed into myRIA.u.add2CartOrDetails or data not in memory.");
	}
				
				},

*/
//for now, only product is supported in quickview. This may change in the future.
//Required Params:  pageType, pid and templateID.
//no defaulting on template id because that'll make expanding this to support other page types more difficult.
//assumes data to be displayed is already in memory.
			quickView : function(P){
				if(P && P.pageType && P.templateID)	{
					if(P.pageType == 'product' && P.pid)	{
						app.ext.store_product.u.prodDataInModal(P);
						}
					else	{
						app.u.throwGMessage("Based on pageType, some other variable is required (ex: pid for pageType = product). P follows: "); app.u.dump(P);
						}
					_gaq.push(['_trackEvent','Quickview','User Event','product',P.pid]);
					}
				else	{
					app.u.throwGMessage("P should contain pageType and templateID. "); app.u.dump(P);
					}
				},

/*
required:
P.stid
P.listID (buyer list id)
*/
			removeItemFromBuyerList : function(P,tagObj)	{
//				app.u.dump(P);
				if(P.stid && P.listID)	{
					app.ext.store_crm.calls.buyerProductListRemoveFrom.init(P.listID,P.stid,tagObj,'immutable');
					app.ext.store_crm.calls.buyerProductListDetail.init(P.listID,{},'immutable'); //update list in memory
					app.model.dispatchThis('immutable');
					if(tagObj.parentID) {$('#'+tagObj.parentID).empty().remove();}
					_gaq.push(['_trackEvent','Manage buyer list','User Event','item removed',P.stid]);
					}
				else	{
					app.u.throwGMessage("ERROR! either stid ["+P.stid+"] or listID ["+P.listID+"] not passed into myRIA.a.removeItemFromBuyerList.",P.parentID)
					}
				},
			
//guts of this found here: http://www.dynamicdrive.com/dynamicindex9/addbook.htm
			bookmarkThis : function()	{
				var url = window.location;
				var title = url;
				if (window.sidebar) // firefox
					window.sidebar.addPanel(title, url, "");
			
				else if(window.opera && window.print){ // opera
					var elem = document.createElement('a');
					elem.setAttribute('href',url);
					elem.setAttribute('title',title);
					elem.setAttribute('rel','sidebar');
					elem.click();
					}
			
				else if(document.all)// ie
					window.external.AddFavorite(url, title);
	
				
				},

			printByElementID : function(id)	{
//				app.u.dump("BEGIN myRIA.a.printByElementID");
				if(id && $('#'+id).length)	{
					var html="<html><body style='font-family:sans-serif;'>";
					html+= document.getElementById(id).innerHTML;
					html+="</body></html>";
					
					var printWin = window.open('','','left=0,top=0,width=600,height=600,toolbar=0,scrollbars=0,status=0');
					printWin.document.write(html);
					printWin.document.close();
					printWin.focus();
					printWin.print();
					printWin.close();
					}
				else	{
					app.u.dump("WARNING! - myRIA.a.printByElementID executed but not ID was passed ["+id+"] or was not found on DOM [$('#'+"+id+").length"+$('#'+id).length+"].");
					}
				},

			showYoutubeInModal : function(videoid)	{
				var $ele = $('#youtubeVideoModal');
				if($ele.length == 0)	{
					$ele = $("<div />").attr('id','youtubeVideoModal').appendTo('body');
					}
				$ele.empty().append("<iframe style='z-index:1;' width='560' height='315' src='https://www.youtube.com/embed/"+videoid+"' frameborder='0' allowfullscreen></iframe>"); //clear any past videos.
				$ele.dialog({modal:true,width:600,height:400,autoOpen:false});
				$ele.dialog('open');
				return false;
				},

//P.listid and p.sku are required.
//optional params include: qty, priority, note, and replace. see API docs for explanation.
			add2BuyerList : function(P){
				var authState = app.u.determineAuthentication();
				if(typeof P != 'object' || !P.pid || !P.listid)	{
					app.u.throwMessage("Uh Oh! Something went wrong. Please try that again or contact the site administrator if error persists. err: required param for add2buyerList was missing. see console for details.");
					app.u.dump("ERROR! params missing for add2BuyerList. listid and pid required. params: "); app.u.dump(P);
					}
				else if(authState != 'authenticated')	{
					app.ext.myRIA.u.showLoginModal();
					$('#loginSuccessContainer').empty(); //empty any existing login messaging (errors/warnings/etc)
//this code is here instead of in showLoginModal (currently) because the 'showCustomer' code is bound to the 'close' on the modal.
					$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Add Item to List').click(function(){
						$('#loginFormForModal').dialog('close');
						app.ext.myRIA.a.add2BuyerList(P) //will re-execute function so after successful login, item is actually submitted to list.
						}).appendTo($('#loginSuccessContainer'));	
					}
				else	{
					var parentID = 'listUpdateMsgContainer';
					var $parent = $('#'+parentID)
					if($parent.length == 0)	{
						$parent = $("<div \/>").attr({'id':parentID,'title':'List Activity'}).appendTo('body');
						$parent.dialog({'autoOpen':false});
						}
					$parent.dialog('open');
					var msg = app.u.statusMsgObject('adding item '+P.pid+' to list: '+P.listid);
					msg.parentID = parentID;
					app.u.throwMessage(msg);
					app.ext.store_crm.calls.buyerProductListAppendTo.init(P,{'parentID':parentID,'callback':'showMessaging','message':'Item '+P.pid+' successfully added to list: '+P.listid},'immutable');
					app.model.dispatchThis('immutable');
					_gaq.push(['_trackEvent','Manage buyer list','User Event','item added',P.pid]);
					}
				},

			saveAddressChange : function()	{
				
				},


//assumes the faq are already in memory.
			showFAQbyTopic : function(topicID)	{
				app.u.dump("BEGIN showFAQbyTopic ["+topicID+"]");
				var templateID = 'faqQnATemplate'
				var $target = $('#faqDetails4Topic_'+topicID).empty().show();
				if(!topicID)	{
					app.u.throwMessage("Uh Oh. It seems an app error occured. Error: no topic id. see console for details.");
					app.u.dump("a required parameter (topicID) was left blank for myRIA.a.showFAQbyTopic");
					}
				else if(!app.data['appFAQs'] || $.isEmptyObject(app.data['appFAQs']['@detail']))	{
					app.u.dump(" -> No data is present");
					}
				else	{
					var L = app.data['appFAQs']['@detail'].length;
					app.u.dump(" -> total #faq: "+L);
					for(var i = 0; i < L; i += 1)	{
						if(app.data['appFAQs']['@detail'][i]['TOPIC_ID'] == topicID)	{
							app.u.dump(" -> faqid matches topic: "+app.data['appFAQs']['@detail'][i]['ID']);
							$target.append(app.renderFunctions.transmogrify({'id':topicID+'_'+app.data['appFAQs']['@detail'][i]['ID'],'data-faqid':+app.data['appFAQs']['@detail'][i]['ID']},templateID,app.data['appFAQs']['@detail'][i]))
							}
						}
					}
				} //showFAQbyTopic
		
		
			}, //action [a]




////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {

//executed when the app loads.  
//sets a default behavior of loading homepage. Can be overridden by passing in P.
			handleAppInit : function(P)	{
//				app.u.dump("BEGIN myRIA.u.handleAppInit");
				if(typeof P != 'object')	{P = {}}
				P = this.detectRelevantInfoToPage(window.location.href); 
				P.back = 0; //skip adding a pushState on initial page load.
//getParams wants string to start w/ ? but doesn't need/want all the domain url crap.
				P.uriParams = app.u.getParametersAsObject('?'+window.location.href.split('?')[1]);
				if(P.uriParams.meta)	{
					app.calls.cartSet.init({'meta':P.uriParams.META},{},'passive');
					}
//				app.u.dump(" -> P follows:");
//				app.u.dump(P);
				app.ext.myRIA.a.showContent('',P);
				return P //returning this saves some additional looking up in the appInit
				},

//obj is going to be the container around the img. probably a div.
//the internal img tag gets nuked in favor of an ordered list.
			addPicSlider2UL : function(){
//				app.u.dump("BEGIN myRIA.u.addPicSlider2UL");
				
				var $obj = $(this);
				if($obj.data('slider') == 'rendered')	{
					//do nothing. list has aready been generated.
//					app.u.dump("the slideshow has already been rendered. re-init");
					window.slider.kill(); //make sure it was nuked.
					window.slider = new imgSlider($('ul',$obj))
					}
				else	{
					$obj.data('slider','rendered'); //used to determine if the ul contents have already been added.
					var pid = $obj.attr('data-pid');
					app.u.dump(" -> pid: "+pid);
					var data = app.data['appProductGet|'+pid]['%attribs'];
					var $img = $obj.find('img')
					var width = $img.attr('width'); //using width() and height() here caused unusual results in the makeImage function below.
					var height = $img.attr('height');
					$obj.width(width).height(height).css({'overflow':'hidden','position':'relative'});
					var $ul = $('<ul>').addClass('slideMe').css({'height':height+'px','width':'20000px'}); /* inline width to override inheretance */
					
					var $li; //recycled.
					for(var i = 2; i <= 10; i += 1)	{
						if(data['zoovy:prod_image'+i])	{
							$li = $('<li>').append(app.u.makeImage({"name":data['zoovy:prod_image'+i],"w":width,"h":height,"b":"FFFFFF","tag":1}));
							$li.appendTo($ul);
							}
						else	{break} //end loop at first empty image spot.
						}
					$li = $("<li>").append($img);
					$ul.prepend($li); //move the original image to the front of the list instead of re-requesting it. prevents a 'flicker' from happening
					$obj.append($ul); //kill existing image. will b replaced w/ imagery in ul.
//					$img.remove(); //get rid of original img instance.
					window.slider = new imgSlider($('ul',$obj))
					}
				},	
				
			changeCursor : function(style)	{
//				app.u.dump("BEGIN myRIA.u.changeCursor ["+style+"]");
				$('html, body').css('cursor',style);
				},

//executed on initial app load AND in some elements where user/merchant defined urls are present (banners).
// Determines what page is in focus and returns appropriate object (r.pageType)
// if no page content can be determined based on the url, the hash is examined and if appropriately formed, used (ex: #company?show=contact or #category?navcat=.something)
// should be renamed getPageInfoFromURL
			detectRelevantInfoToPage : function(URL)	{
				var r = {}; //what is returned. r.pageInfo and r.navcat or r.show or r.pid
				var url = URL; //leave original intact.
				var hashObj;
				if(url.indexOf('#') > -1)	{
					var tmp = url.split("#");
					url = tmp[0]; //strip off everything after hash (#)
					hashObj = this.getPageInfoFromHash(tmp[1]); //will be an object if the hash was a valid pageInfo anchor. otherwise false.
					}

				if(url.indexOf('?') > -1) {
					var tmp = url.split('?')[1];
					r.uriParams = tmp; //a simple string of uri params. used to add back onto uri in pushState.
					url = url.split('?')[0] //get rid of any uri vars.
					} //keep the params handy 

				if(url.indexOf('/product/') > -1)	{
					r.pageType = 'product';
					r.pid = url.split('/product/')[1]; //should be left with SKU or SKU/something_seo_friendly.html
					if(r.pid.indexOf('/') > 0)	{r.pid = r.pid.split('/')[0];} //should be left with only SKU by this point.
					}
				else if(url.indexOf('/category/') > -1)	{
					r.pageType = 'category'
					r.navcat = url.split('/category/')[1]; //left with category.safe.id or category.safe.id/

					if(r.navcat.charAt(r.navcat.length-1) == '/')	{r.navcat = r.navcat.slice(0, -1)} //strip trailing /
					if(r.navcat.charAt(0) != '.')	{r.navcat = '.'+r.navcat}
					}
				else if(url.indexOf('/customer/') > -1)	{
					r.pageType = 'customer'
					r.show = url.split('/customer/')[1]; //left with order_summary or order_summary/
					if(r.show.charAt(r.show.length-1) == '/')	{r.show = r.show.slice(0, -1)} //strip trailing /
					}
				else if(url.indexOf('/company/') > -1)	{
					r.pageType = 'company'
					r.show = url.split('/company/')[1]; //left with order_summary or order_summary/
					if(r.show.charAt(r.show.length-1) == '/')	{r.show = r.show.slice(0, -1)} //strip trailing /
					}
//use hash. check before homepage so something.com#checkout or index.html#checkout doesn't load homepage.
				else if(!$.isEmptyObject(hashObj))	{
					r = hashObj;
					}
//quickstart is here so a user doesn't see a page not found error by default.
				else if(url.indexOf('index.html') > -1)	{
					r.pageType = 'homepage'
					r.navcat = '.'; //left with category.safe.id or category.safe.id/
					}
				else if(url.indexOf('quickstart.html') > -1)	{
					var msg = app.u.errMsgObject('Rename this file as index.html to decrease the likelyhood of accidentally saving over it.',"MVC-INIT-MYRIA_1000")
					msg.skipAutoHide = true;
					app.u.throwMessage(msg);
					r.pageType = '404';
					}
//the url in the domain may or may not have a slash at the end. Check for both
				else if(url == zGlobals.appSettings.http_app_url || url+"/" == zGlobals.appSettings.http_app_url || url == zGlobals.appSettings.https_app_url || url+"/" == zGlobals.appSettings.https_app_url)	{
					r.pageType = 'homepage'
					r.navcat = '.'; //left with category.safe.id or category.safe.id/
					}
				else	{
//					alert('Got to else case.');
					r.pageType = '404';
					}
//				app.u.dump("detectRelevantInfoToPage = ");
//				app.u.dump(r);
				return r;
				},





/*

#########################################     FUNCTIONS FOR DEALING WITH pageInfo obj and/or HASH

*/

//pass in a pageInfo object and a valid hash will be returned.
// EX:  pass: {pageType:company,show:contact} and return: #company?show=contact
// EX:  pass: {pageType:product,pid:TEST} and return: #product?pid=TEST
// if a valid hash can't be built, false is returned.

			getHashFromPageInfo : function(P)	{
//				app.u.dump("BEGIN myRIA.u.getHashFromPageInfo");
				var r = false; //what is returned. either false if no match or hash (#company?show=contact)
				if(this.thisPageInfoIsValid(P))	{
					if(P.pageType == 'product' && P.pid)	{r = '#product?pid='+P.pid}
					else if(P.pageType == 'category' && P.navcat)	{r = '#category?navcat='+P.navcat}
					else if(P.pageType == 'homepage')	{r = '#category?navcat=.'}
					else if(P.pageType == 'cart')	{r = '#cart?show='+P.show}
					else if(P.pageType == 'checkout')	{r = '#checkout?show='+P.show}
					else if(P.pageType == 'search' && P.KEYWORDS)	{r = '#search?KEYWORDS='+P.KEYWORDS}
					else if(P.pageType && P.show)	{r = '#'+P.pageType+'?show='+P.show}
					else	{
						//shouldn't get here because pageInfo was already validated. but just in case...
						app.u.dump("WARNING! invalid pageInfo object passed into getHashFromPageInfo. infoObj: ");
						app.u.dump(P);
						}
					}
				else	{
					app.u.dump("WARNING! invalid pageInfo object passed into getHashFromPageInfo. infoObj: ");
					app.u.dump(P);
					}
				return r;
				},

//will return a t/f based on whether or not the object passed in is a valid pageInfo object.
//ex: category requires navcat. company requires show.
			thisPageInfoIsValid : function(P)	{
				var r = false; //what is returned. boolean.
				if($.isEmptyObject(P))	{
					//can't have an empty object.
					app.u.dump("WARNING! thisPageInfoIsValid did not receive a valid object.");
					}
				else if(P.pageType)	{
					if(P.pageType == 'product' && P.pid)	{r = true}
					else if(P.pageType == 'category' && P.navcat)	{r = true}
					else if(P.pageType == 'homepage')	{r = true}
					else if(P.pageType == 'cart')	{r = true}
					else if(P.pageType == 'checkout')	{r = true}
					else if(P.pageType == 'search' && P.KEYWORDS)	{r = true}
					else if(P.pageType == 'customer' && P.show)	{r = true}
					else if(P.pageType == 'company' && P.show)	{r = true}
					else	{
						//no matching params for specified pageType
						app.u.dump("WARNING! thisPageInfoIsValid had no matching params for specified pageType ["+P.pageType+"]");
						}
					}
				else{
					app.u.dump("WARNING! thisPageInfoIsValid did not receive a pageType");
					}
//				app.u.dump(" -> thisPageInfoIsValid.r = "+r);
				return r;
				},

//pass in a hash string and a valid pageInfo object will be returned.
// EX:  pass: #company?show=contact and return: {pageType:company,show:contact}
// EX:  pass: #product?pid=TEST and return: {pageType:product,pid:TEST}
// if the hash is not a valid pageInfo, false is returned.


			getPageInfoFromHash : function(HASH)	{
				var myHash = HASH;
//make sure first character isn't a #. location.hash is used a lot and ie8 (maybe more) include # in value.
				if(myHash.indexOf('#') == 0)	{myHash = myHash.substring(1);}
				var P = {}; //what is returned. P.pageType and based on value of page type, p.show or p.pid or p.navcat, etc
				var splits = myHash.split('?'); //array where 0 = 'company' or 'search' and 1 = show=returns or keywords=red
				P = app.u.getParametersAsObject(splits[1]); //will set P.show=something or P.pid=PID
				P.pageType = splits[0];
				if(!P.pageType || !this.thisPageInfoIsValid(P))	{
					P = false;
					}
				return P;
				},



//pass in a pageInfo obj and a relative path will be returned.
//EX:  pass: {pageType:category,navcat:.something} 		return: /category/something/
//used in add push state and also for addthis.
// ### should be renamed getURLFromPageInfo
			buildRelativePath : function(P)	{
				var relativePath; //what is returned.
				switch(P.pageType)	{
				case 'product':
					relativePath = 'product/'+P.pid+'/';
					break;
				case 'category':

//don't want /category/.something, wants /category/something
//but the period is needed for passing into the pushstate.
					var noPrePeriod = P.navcat.charAt(0) == '.' ? P.navcat.substr(1) : P.navcat; 
					relativePath = 'category/'+noPrePeriod+'/';
					break;
				case 'customer':
					relativePath = 'customer/'+P.show+'/';
					break;
				case 'checkout':
					relativePath = '#checkout?show=checkout';
					break;
				case 'cart':
					relativePath = '#cart?show=cart';
					break;

				case 'company':
					relativePath = '#company?show='+P.show;
					break;

				default:
					//uh oh. what are we?
					relativePath = P.show;
					}
				return relativePath;
				},



//a generic function for guessing what type of object is being dealt with. Check for common params.  
			whatAmIFor : function(P)	{
//				app.u.dump("BEGIN myRIA.u.whatAmIFor");
//				app.u.dump(P);
				var r = false; //what is returned
				if(P.pid)	{r = 'product'}
				else if(P.catSafeID == '.'){r = 'homepage'}
				else if(P.navcat == '.'){r = 'homepage'}
				else if(P.catSafeID){r = 'category'}
				else if(P.keywords || P.KEYWORDS){r = 'search'}
				else if(P.navcat){r = 'category'}
				else if(P.path){ r = 'category'}
				else if(P.page && P.page.indexOf('/customer/') > 0)	{r = 'customer'}
				else if(P.page)	{r = 'company'}
				else if(P.pageType == 'cart')	{r = 'cart'}
				else if(P.show == 'cart')	{r = 'cart'}
				else if(P.pageType == 'checkout')	{r = 'checkout'}
				else if(P.show == 'checkout')	{r = 'checkout'}
				else if(P.page)	{r = 'company'}
				return r;
				},
				
				

/*

#########################################     FUNCTIONS FOR DEALING WITH CHANGING URL or HASH (popstate)

*/

				
				
//Executed instead of handlePopState if popState isn't supporeted (ex: IE < 10).
// from the hash, formatted as #company?show=returns, it determines pageType (company)
// a pageInfo (pio) object is created and validated (pageInfo will be set to false if invalid)
//showcontent is NOT executed if pio is not valid (otherwise every anchor would execute a showContent - that would be bad.)
// _ignoreHashChange is set to true if the hash is changed w/ js instead of an anchor or some other browser related event.
// this keeps the code inside handleHashState from being triggered when no update desired.
// ex: showContent changes hash state executed and location.hash doesn't match new pageInfo hash. but we don't want to retrigger showContent from the hash change.

			handleHashState : function()	{
//				app.u.dump("BEGIN myRIA.u.handleHashState");
				var hash = window.location.hash;
				var pio = this.getPageInfoFromHash(hash); //if not valid pageInfo hash, false is returned
//				app.u.dump(" -> hash: "+hash);
				if(!$.isEmptyObject(pio) && _ignoreHashChange === false)	{
					showContent('',pio);
					}
				_ignoreHashChange = false; //always return to false so it isn't "left on" by accident.
				},

//p is an object that gets passed into a pushState in 'addPushState'.  pageType and pageInfo are the only two params currently.
//https://developer.mozilla.org/en/DOM/window.onpopstate
			handlePopState : function(P)	{
//				app.u.dump("BEGIN handlePopState");
//				app.u.dump(P);

//on initial load, P will be blank.
				if(P)	{
					P.back = 0;
					app.ext.myRIA.a.showContent('',P);
//					app.u.dump("POPSTATE Executed.  pageType = "+P.pageType+" and pageInfo = "+P.pageInfo);
					}
				else	{
//					app.u.dump(" -> no event.state (P) defined.");
					}
				},



//pass in the 'state' object. ex: {'pid':'somesku'} or 'catSafeID':'.some.safe.path'
//will add a pushstate to the browser for the back button and change the URL
//http://spoiledmilk.dk/blog/html5-changing-the-browser-url-without-refreshing-page
//when a page is initially loaded or reloaded, P.back is set to zero. This won't stop the addition of a popState, but will instead replace the most recent popstate.
//this ensures there is always a popstate (content won't get loaded properly if there's no object) and that no duplicates are created.


			addPushState : function(P)	{
//				app.u.dump("BEGIN addPushState. ");
				var useAnchor = false; //what is returned. set to true if pushState not supported
				var title = P.pageInfo;
				var historyFunction = P.back == 0 ? 'replaceState' : 'pushState'; //could be changed to replaceState if back == 0;
				var fullpath = ''; //set to blank by default so += does not start w/ undefined
//for 404 pages, leave url as is for troubleshooting purposes (more easily track down why page is 404)	
				if(P.pageType == '404')	{
					fullpath = window.location.href;
					}
				else	{
					if('https:' == document.location.protocol)	{
						fullpath = zGlobals.appSettings.https_app_url;
						}
					else	{
						fullpath = zGlobals.appSettings.http_app_url;
						}
	//				app.u.dump(P);
	//handle cases where the homepage is treated like a category page. happens in breadcrumb.
					if(P.navcat == '.')	{
						P.pageType = 'homepage'
						}
					else	{
						fullpath += this.buildRelativePath(P);
						}
					if(typeof P.uriParams == 'string' && app.u.isSet(P.uriParams) )	{fullpath += '?'+P.uriParams} //add params back on to url.
					else if(typeof P.uriParams == 'object' && !$.isEmptyObject(P.uriParams)) {
//will convert uri param object into uri friendly key value pairs.						
						fullpath += '?';
						var params = $.map(P.uriParams, function(n, i){
							return i+"="+n;
							}).join("&");
						fullpath += params;
						}
					}
//!!! need to find an IE8 friendly way of doing this.  This code caused a script error					
//				document.getElementsByTagName('title')[0].innerHTML = fullpath; //doing this w/ jquery caused IE8 to error. test if changed.

				try	{
					window.history[historyFunction](P, title, fullpath);
					}
				catch(err)	{
					//Handle errors here
					useAnchor = true;
					}
				return useAnchor;
				},




/*

#########################################     FUNCTIONS FOR DEALING WITH EDITABLE

*/


			makeRegionEditable : function($parent){
var r; //what is returned. # of editable elements.				
//info on editable can be found here: https://github.com/tuupola/jquery_jeditable
$parent.find('.editable').each(function(){
	r += 1; //incremented for each editable element.
	var $text = $(this)
	if($text.attr('title'))	{
		$text.before("<label><br />"+$text.attr('title')+": </label>"); //br is in label so on cancel when label is hidden, display returns to normal.
		}
	var defaultValue = $text.text(); //saved to data.defaultValue and used to compare the post-editing value to the original so that if no change occurs, .edited class not added. Also used for restoring default value
//	app.u.dump(" -> defaultValue: "+defaultValue);
	$text.addClass('editEnabled').data('defaultValue',defaultValue).editable(function(value,settings){
//onSubmit code:
		if(value == $(this).data('defaultValue'))	{
			$(this).removeClass('editing');
			app.u.dump("field edited. no change.")
			}
		else	{
			$(this).addClass('edited').removeClass('editing');
			app.u.dump("NOTE - this needs to update the change log");
			}
		return value;
		}, {
		  indicator : 'loading...', //can be img tag
		  onblur : 'submit',
		  type : 'text',
		  style  : 'inherit'
		  }); //editable
	}); //each

return r;
				
				
				}, //makeRegionEditable



//restore a series of elements from jeditable back to a normal html block.
			destroyEditable : function($parent)	{
				$('.edited',$parent).each(function(){
					$(this).text($(this).data('defaultValue')).removeClass('edited'); //restore defaults
					})
				$('.editable',$parent).removeClass('editEnabled').editable('destroy');
				$('label',$parent).empty().remove(); //removed so if edit is clicked again, duplicates aren't created.
				}, //destroyEditable


//This will get all the key value pairs from $parent, even if the value didn't change.
//useful when all params in an update must be set, such as address update.
			getAllDataFromEditable : function($parent)	{
				var obj = {}; //what is returned. either an empty object or an assoc of key/value pairs where key = attribute and value = new value
				$parent.find('[data-bind]').each(function(){
					var bindData = app.renderFunctions.parseDataBind($(this).attr('data-bind'));
					obj[app.renderFunctions.parseDataVar(bindData['var'])] = $(this).text();
//in jeditable, if you edit then click 'save' directly, the .text() val hasn't been updated yet.
//so this'll search for the input value. if additional (more than just text input) are supported later, this wil need to be updated.
					if(!$(this).text())
						obj[app.renderFunctions.parseDataVar(bindData['var'])] = $(this).find('input').val()
					});
				return obj;	
				},





/*

#########################################     FUNCTIONS FOR DEALING WITH PAGE CONTENT (SHOW)

*/


//rather than having all the params in the dom, just call this function. makes updating easier too.
			showProd : function(P)	{
				var pid = P.pid
//				app.u.dump("BEGIN myRIA.u.showProd ["+pid+"]");
				if(!app.u.isSet(pid))	{
					app.u.throwMessage("Uh Oh. It seems an app error occured. Error: no product id. see console for details.",true);
					app.u.dump("ERROR! showProd had no P.pid.  P:"); app.u.dump(P);
					}
				else	{
					P.templateID = 'productTemplate';
					P.state = 'onInits'
					app.ext.myRIA.u.handleTemplateFunctions(P);
	//				app.ext.store_product.u.prodDataInModal({'pid':pid,'templateID':'productTemplate',});

					$('#mainContentArea').empty().append(app.renderFunctions.createTemplateInstance(P.templateID,"productViewer"));
//					app.u.dump(" -> product template instance created.");

//need to obtain the breadcrumb info pretty early in the process as well.
					if(app.ext.myRIA.vars.session.recentCategories.length > 0)	{
						app.ext.store_navcats.u.addQueries4BreadcrumbToQ(app.ext.myRIA.vars.session.recentCategories[0])
						}
					
					app.ext.store_product.calls.appReviewsList.init(pid);  //store_product... appProductGet DOES get reviews. store_navcats...getProd does not.
					app.ext.store_product.calls.appProductGet.init(pid,{'callback':'showProd','extension':'myRIA','parentID':'productViewer','templateID':'productTemplate'});
					app.model.dispatchThis();
					}
				
				}, //showProd
				
				
//Show one of the company pages. This function gets executed by showContent.
//handleTemplateFunctions gets executed in showContent, which should always be used to execute this function.
			showCompany : function(P)	{
				P.show = P.show ? P.show : 'about'; //what page to put into focus. default to 'about us' page
				$('#mainContentArea').empty(); //clear Existing content.
				
				P.templateID = 'companyTemplate';
				P.state = 'onInits';
				app.ext.myRIA.u.handleTemplateFunctions(P);
				
				var parentID = 'mainContentArea_company'; //this is the id that will be assigned to the companyTemplate instance.
				$('#mainContentArea').append(app.renderFunctions.createTemplateInstance(P.templateID,parentID));
				
				app.calls.appProfileInfo.init(app.vars.profile,{'callback':'showCompany','extension':'myRIA','infoObj':P,'parentID':parentID},'mutable');
				app.model.dispatchThis();

				}, //showCompany
				
				
			showSearch : function(P)	{
//				app.u.dump("BEGIN myRIA.u.showSearch. P follows: ");
//				app.u.dump(P);
				P.templateID = 'searchTemplate'
				P.state = 'onInits';
				app.ext.myRIA.u.handleTemplateFunctions(P);
				
				$('#mainContentArea').empty().append(app.renderFunctions.createTemplateInstance(P.templateID,'mainContentArea_search'))

//add item to recently viewed list IF it is not already in the list.
				if($.inArray(P.KEYWORDS,app.ext.myRIA.vars.session.recentSearches) < 0)	{
					app.ext.myRIA.vars.session.recentSearches.unshift(P.KEYWORDS);
					}
				app.ext.myRIA.u.showRecentSearches();
				app.ext.store_search.u.handleElasticSimpleQuery(P.KEYWORDS,{'callback':'handleElasticResults','extension':'store_search','templateID':'productListTemplateResults','parentID':'resultsProductListContainer'});
//legacy search.
//				app.ext.store_search.calls.searchResult.init(P,{'callback':'showResults','extension':'myRIA'});
				// DO NOT empty altSearchesLis here. wreaks havoc.
				app.model.dispatchThis();

				P.state = 'onCompletes'; //needed for handleTemplateFunctions.
				app.ext.myRIA.u.handleTemplateFunctions(P);

				}, //showSearch



//pio is PageInfo object
//this showCart should only be run when no cart update is being run.
//this is run from showContent.
// when a cart update is run, the handleCart response also executes the handleTemplateFunctions
			showCart : function(P)	{
				if(typeof P != 'object'){var P = {}}
//				app.u.dump("BEGIN myRIA.u.showCart");
// ### update. if mainContentArea is empty, put the cart there. if not, show in modal.
				P.templateID = 'cartTemplate'
				P.state = 'onInits'; //needed for handleTemplateFunctions.
				app.ext.myRIA.u.handleTemplateFunctions(P);
				app.ext.store_cart.u.showCartInModal(P);
				P.state = 'onCompletes'; //needed for handleTemplateFunctions.
				app.ext.myRIA.u.handleTemplateFunctions(P);
				}, //showCart



//Customer pages differ from company pages. In this case, special logic is needed to determine whether or not content can be displayed based on authentication.
// plus, most of the articles require an API request for more data.
//handleTemplateFunctions gets executed in showContent, which should always be used to execute this function.
			showCustomer : function(P)	{
//				app.u.dump("BEGIN showCustomer. P: "); app.u.dump(P);
				var r = true; //what is returned. set to false if content not shown (because use is not logged in)
				if(P && P.uriParams && P.uriParams.cartid && P.uriParams.orderid)	{
					P.show = 'invoice'; //force to order view if these params are set (most likely invoice view).
					}
				else if (P.show)	{
					//p.show is already set.
					}
				else	{
					P.show = 'newsletter'
					}
				$('#mainContentArea').empty();
//				app.u.dump(" -> P follows:"); app.u.dump(P);
				var parentID = 'mainContentArea_customer'; //this is the id that will be assigned to the companyTemplate instance.
				$('#mainContentArea').append(app.renderFunctions.createTemplateInstance('customerTemplate',parentID))
				app.ext.myRIA.u.bindNav('#sideline a');
				var authState = app.u.determineAuthentication();
				
				P.templateID = 'customerTemplate';
				P.state = 'onInits';
				app.ext.myRIA.u.handleTemplateFunctions(P);

				
				
				if(authState != 'authenticated' && this.thisArticleRequiresLogin(P))	{
					r = false;
					app.ext.myRIA.u.showLoginModal();
					$('#loginSuccessContainer').empty(); //empty any existing login messaging (errors/warnings/etc)
//this code is here instead of in showLoginModal (currently) because the 'showCustomer' code is bound to the 'close' on the modal.
					$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Continue').click(function(){
						$('#loginFormForModal').dialog('close');
						app.ext.myRIA.u.showCustomer(P) //binding this will reload this 'page' and show the appropriate content.
						}).appendTo($('#loginSuccessContainer'));					
					}
//should only get here if the page does not require authentication or the user is logged in.
				else	{
					$('#newsletterArticle').hide(); //hide the default.
					$('#'+P.show+'Article').show(); //only show content if page doesn't require authentication.
					switch(P.show)	{
						case 'newsletter':
							$('#newsletterFormContainer').empty();
							app.ext.store_crm.u.showSubscribe({'parentID':'newsletterFormContainer','templateID':'subscribeFormTemplate'});
							break;

						case 'invoice':
						
							var orderID = P.uriParams.orderid
							var cartID = P.uriParams.cartid
							var parentSafeID = 'orderContentsTable_'+app.u.makeSafeHTMLId(orderID);
							var $invoice = $("<article />").attr('id','orderInvoiceSoloPage');
							$invoice.append(app.renderFunctions.createTemplateInstance('orderContentsTemplate',parentSafeID));
							$invoice.appendTo($('#mainContentArea_customer .mainColumn'));
							app.ext.store_crm.calls.buyerOrderGet.init({'orderid':orderID,'cartid':cartID},{'callback':'translateTemplate','templateID':'orderContentsTemplate','parentID':parentSafeID},'mutable');
							app.model.dispatchThis('mutable');
						
						
						
						case 'orders':
							app.ext.store_crm.calls.buyerPurchaseHistory.init({'parentID':'orderHistoryContainer','templateID':'orderLineItemTemplate','callback':'showOrderHistory','extension':'store_crm'});
							break;
						case 'lists':
							app.ext.store_crm.calls.buyerProductLists.init({'parentID':'listsContainer','callback':'showBuyerLists','extension':'myRIA'});
							break;
						case 'myaccount':
//							app.u.dump(" -> myaccount article loaded. now show addresses...");
							app.ext.store_crm.calls.buyerAddressList.init({'callback':'showAddresses','extension':'myRIA'},'mutable');
							break;
						default:
							app.u.dump("WARNING - unknown article/show ["+P.show+" in showCustomer. ");
						}
					app.model.dispatchThis();
					}

				P.state = 'onCompletes'; //needed for handleTemplateFunctions.
				app.ext.myRIA.u.handleTemplateFunctions(P);
				$('#mainContentArea_customer').removeClass('loadingBG');
				return r;
				},  //showCustomer
				
				
//here, we error on the side of NOT requiring login. if a page does require login, the API will return that.
//this way, if a new customer page is introduced that doesn't require login, it isn't hidden.
			thisArticleRequiresLogin : function(P)	{
				var r = false; //what is returned. will return true if the page requires login
				switch(P.show)	{
					case 'myaccount':
					case 'changepassword':
					case 'lists':
					case 'orders':
						r = true;
						break;
					default:
						r = false;
					}
				return r;
				},


//pass in a bindNav anchor and the 'pageInfo' will be returned.
//ex #category?navcat=.something will return {pageType:category,navcat:.something}
			parseAnchor : function(str)	{
//					app.u.dump("GOT HERE");
					var tmp1 = str.substring(1).split('?');
					var tmp2 = tmp1[1].split('=');
					var P = {};
					P.pageType = tmp1[0];
					P[tmp2[0]] = tmp2[1];
//					app.u.dump(P);
					return P;
				}, //parseAnchor
			
//selector is a jquery selector. could be as simple as .someClass or #someID li a
//will add an onclick event of showContent().  uses the href value to set params.
//href should be ="#customer?show=myaccount" or "#company?show=shipping" or #product?pid=PRODUCTID" or #category?navcat=.some.cat.id
			bindNav : function(selector)	{
//				app.u.dump("BEGIN bindNav ("+selector+")");
				$(selector).each(function(){
					var $this = $(this);
//					app.u.dump($this.attr('href'));
					var P = app.ext.myRIA.u.parseAnchor($this.attr('href'));
					if(P.pageType == 'category' && P.navcat && P.navcat != '.'){
//for bindnavs, get info to have handy. the timeout is so that the app has time to load/init and this has no impact.
//also to reduce # of mutliple requests (init may get this cat already because it's in focus, for instance).
setTimeout(function(){
	app.ext.store_navcats.calls.appCategoryDetailMax.init(P.navcat,{},'passive');
	},7000); //throw this into the q to have handy. do it later 
						
						}
					$this.click(function(event){
//						event.preventDefault(); //cancels any action on the href. keeps anchor from jumping.
						return app.ext.myRIA.a.showContent('',P)
						});
					});
				}, //bindNav

/*
will close any open modals. 
by closing modals only (instead of all dialogs), we can use dialogs to show information that we want to allow the
buyer to 'take with them' as they move between  pages.
*/
			closeAllModals : function(){
//				app.u.dump("BEGIN myRIA.u.closeAllModals");
				$(".ui-dialog-content").each(function(){
					var $dialog = $(this);
///					app.u.dump(" -> $dialog.dialog('option','dialog'): "); app.u.dump($dialog.dialog('option','dialog'));
					if($dialog.dialog( "option", "modal" ) === true)	{
						$dialog.dialog("close"); //close all modal windows.
						}
					});
				},
		
			showLoginModal : function()	{
//make sure form is showing and previous messaging is removed/reset.
				$('#loginSuccessContainer').hide(); //contains 'continue' button.
				$('#loginMessaging, #recoverPasswordMessaging').empty(); //used for success and fail messaging.
				$('#loginFormContainer, #recoverPasswordContainer').show(); //contains actual form and password recovery form (second id)
				$('#loginFormForModal').dialog({modal: true,width:550,autoOpen:false});
				$('#loginFormForModal').dialog('open');
				
		
				}, //showLoginModal

//executed from showCompany (used to be used for customer too)
//articles should exist inside their respective pageInfo templates (companyTemplate or customerTemplate)
//NOTE - as of version 201225, the parameter no longer has to be a string (subject), but can be an object. This allows for uri params or any other data to get passed in.
			showArticle : function(P)	{
//				app.u.dump("BEGIN myRIA.u.showArticle ("+subject+")");
				$('#mainContentArea .textContentArea').hide(); //hide all the articles by default and we'll show the one in focus later.
				
				var subject;
				if(typeof P == 'object')	{
					subject = P.show
					$('.sideline .'+subject).addClass('ui-state-highlight');
					}
				else if(typeof P == 'string')	{subject = P}
				else	{
					app.u.dump("WARNING - unknown type for 'P' ["+typeof P+"] in showArticle")
					}
				if(subject)	{
					$('#'+subject+'Article').show(); //only show content if page doesn't require authentication.
					switch(subject)	{
						case 'faq':
							app.ext.store_crm.calls.appFAQsAll.init({'parentID':'faqContent','callback':'showFAQTopics','extension':'store_crm','templateID':'faqTopicTemplate'});
							app.model.dispatchThis();
							break;
						default:
							//the default action is handled in the 'show()' above. it happens for all.
						}
					}
				else	{
					app.u.dump("WARNING! - no article/show set for showArticle");
					}
				},

			showRecentSearches : function()	{
				var o = ''; //output. what's added to the recentSearchesList ul
				var L = app.ext.myRIA.vars.session.recentSearches.length;
				var keywords,count;
				for(i = 0; i < L; i++)	{
					keywords = app.ext.myRIA.vars.session.recentSearches[i];
//					app.u.dump(" -> app.data['searchResult|"+keywords+"'] and typeof = "+typeof app.data['searchResult|'+keywords]);
					count = $.isEmptyObject(app.data['appPublicSearch|'+keywords]) ? '' : app.data['appPublicSearch|'+keywords]['_count']
					if(app.u.isSet(count))	{
						count = " ("+count+")";
						}
//					app.u.dump(" -> adding "+keywords+" to list of recent searches");
// 
					o += "<li><a href='#' onClick=\"$('#headerKeywordsInput').val('"+keywords+"'); $('#headerSearchFrm').submit(); return false;\">"+keywords+count+"<\/a><\/li>";
					}
				$('#recentSearchesList').html(o);
				},
//best practice would be to NOT call this function directly. call showContent.
			showPage : function(P)	{

//app.u.dump("BEGIN myRIA.u.showPage("+P.navcat+")");

$('#mainContentArea').empty();

var catSafeID = P.navcat;
if(!catSafeID)	{
	app.u.throwMessage('Oops!  It seems an error occured. You can retry whatever you just did and hopefully you will meet with more success. If error persists, please try again later or contact the site administrator. We apologize for any inconvenience.<br \/>[err: no navcat passed into myRIA.showPage]');
	}
else	{
	if(P.templateID){
		//templateID 'forced'. use it.
		}
	else if(catSafeID == '.' || P.pageType == 'homepage')	{
		P.templateID = 'homepageTemplate'
		}
	else	{
		P.templateID = 'categoryTemplate'
		}
	P.state = 'onInits';
	app.ext.myRIA.u.handleTemplateFunctions(P);
	
	var parentID = 'page_'+app.u.makeSafeHTMLId(catSafeID);
	$('#mainContentArea').append(app.renderFunctions.createTemplateInstance(P.templateID,{"id":parentID,"catsafeid":catSafeID}));
	app.ext.store_navcats.calls.appCategoryDetailMax.init(catSafeID,{'callback':'fetchPageContent','extension':'myRIA','templateID':P.templateID,'parentID':parentID});
	app.model.dispatchThis();
	}
			
				}, //showPage



//required params include templateid and either: P.navcat or P.pid  navcat can = . for homepage.
//load in a template and the necessary queries will be built.
//currently, only works on category and home page templates.
			buildQueriesFromTemplate : function(P)	{
//app.u.dump("BEGIN myRIA.u.buildQueriesFromTemplate");
//app.u.dump(P);

var numRequests = 0; //will be incremented for # of requests needed. if zero, execute showPageContent directly instead of as part of ping. returned.
var catSafeID = P.navcat;
var myAttributes = new Array(); // used to hold all the 'page' attributes that will be needed. passed into appPageGet request.
var elementID; //used as a shortcut for the tag ID, which is requied on a search element. recycled var.

var tagObj = P;  //used for ping and in handleCallback if ping is skipped.
tagObj.callback = 'showPageContent'
tagObj.searchArray = new Array(); //an array of search datapointers. added to _tag so they can be translated in showPageContent
tagObj.extension = 'myRIA'

//goes through template.  Put together a list of all the data needed. Add appropriate calls to Q.
app.templates[P.templateID].find('[data-bind]').each(function()	{

	var $focusTag = $(this);
	var eleid = $focusTag.attr('id') ? $focusTag.attr('id') : ''; //element id. default to blank. used in prodlists.
		
//proceed if data-bind has a value (not empty).
	if(app.u.isSet($focusTag.attr('data-bind'))){
		
		var bindData = app.renderFunctions.parseDataBind($focusTag.attr('data-bind')) ;
//		app.u.dump(bindData);
		var namespace = bindData['var'].split('(')[0];
		var attribute = app.renderFunctions.parseDataVar(bindData['var']);
//these get used in prodlist and subcat elements (anywhere loadstemplate is used)
		bindData.templateID = bindData.loadsTemplate;
		bindData.parentID = $focusTag.attr('id');

//		app.u.dump(" -> namespace: "+namespace);
//		app.u.dump(" -> attribute: "+attribute);
		

		if(namespace == 'elastic-native')	{
//			app.u.dump(" -> Elastic-native namespace");
			elementID = $focusTag.attr('id');
			if(elementID)	{
				numRequests += app.ext.store_search.calls.appPublicProductSearch.init(jQuery.parseJSON(attribute),{'datapointer':'appPublicSearch|'+elementID,'templateID':bindData.loadsTemplate});
				tagObj.searchArray.push('appPublicSearch|'+elementID); //keep a list of all the searches that are being done. used in callback.
				}
			}
//session is a globally recognized namespace. It's content may require a request. the data is in memory (myRIA.vars.session)
		else if(namespace == 'session')	{

			}

//handle all the queries that are specific to a product.
//by now the product info, including variations, inventory and review 'should' already be in memory (showProd has been executed)
// the callback, showPageContent, does not run transmogrify over the product data. the lists are handled through buildProdlist, so if any new attributes
// are supported that may require a request for additional data, something will need to be added to showPageContent to handle the display.
// don't re-render entire layout. Inefficient AND will break some extensions, such as powerreviews.
		else if(P.pid)	{
			if(bindData.format == 'productList')	{
//				app.u.dump(" -> "+attribute+": "+app.data['appProductGet|'+P.pid]['%attribs'][attribute]);
				if(app.u.isSet(app.data['appProductGet|'+P.pid]['%attribs'][attribute]))	{ 
//bindData is passed into buildProdlist so that any supported prodlistvar can be set within the data-bind. (ex: withInventory = 1)
					bindData.csv = app.ext.store_prodlist.u.handleAttributeProductList(app.data['appProductGet|'+P.pid]['%attribs'][attribute]);
					numRequests += app.ext.store_prodlist.u.buildProductList(bindData);
					}
				}
				
			else if(namespace == 'reviews')	{
				//reviews is a recognized namespace, but data is already retrieved.
				}				

			else if(namespace == 'product')	{
				//do nothing here, but make sure the 'else' for unrecognized namespace isn't reached.
				}
			else	{
				app.u.throwMessage("Uh oh! unrecognized namespace ["+namespace+"] used on attribute "+attribute+" for pid "+P.pid);
				app.u.dump("ERROR! unrecognized namespace ["+namespace+"] used on attribute "+attribute+" for pid "+P.pid);
				}
			}// /p.pid


// this is a navcat in focus
		else	{
			if(namespace == 'page')	{
				myAttributes.push(attribute);  //set value to the actual value
				}
			else if(namespace == 'category' && attribute == '@subcategoryDetail' )	{
	//			app.u.dump(" -> category(@subcategoryDetail) found");
	//check for the presence of subcats. if none are present, do nothing.
				if(typeof app.data['appCategoryDetail|'+catSafeID]['@subcategoryDetail'] == 'object' && !$.isEmptyObject(app.data['appCategoryDetail|'+catSafeID]['@subcategoryDetail']))	{
	//				app.u.dump(" -> subcats present");
					numRequests += app.ext.store_navcats.u.getChildDataOf(catSafeID,'appCategoryDetailMax');
					}
				}
			else if(namespace == 'category' && bindData.format == 'breadcrumb')	{
				numRequests += app.ext.store_navcats.u.addQueries4BreadcrumbToQ(catSafeID)
				}
			else if(namespace == 'category' && attribute == '@products' )	{
				var itemsPerPage = bindData.items_per_page ? bindData.items_per_page : 15;
				 
	//			app.u.dump(" -> category(@products) found.");
				if(typeof app.data['appCategoryDetail|'+catSafeID]['@products'] == 'object' && !$.isEmptyObject(app.data['appCategoryDetail|'+catSafeID]['@products']))	{
	//				app.u.dump("fetching product records");
					bindData.parentID = app.u.isSet(bindData.parentID) ? bindData.parentID : eleid; //prodlists really want an id.
					bindData.csv = app.data['appCategoryDetail|'+catSafeID]['@products']; // setProdlistVars wants a csv.
					app.ext.store_prodlist.u.setProdlistVars(bindData); //build prodlist object
					bindData.skipCreateInstance = true; //not implemented yet. prodlist needs substantial improvements.
	//get the first page of product. The rest will be retrieved later in the process, but this lets us get as much in front of the user as quickly as possible.
	//right now, this doesn't have good support for variations or inventory. ### planned improvement
					numRequests += app.ext.store_prodlist.u.getProductDataForList(app.data['appCategoryDetail|'+catSafeID]['@products'].slice(0,itemsPerPage),eleid,'mutable');
					}
				}
			else if(namespace == 'category')	{
				// do nothing. this would be hit for something like category(pretty), which is perfectly valid but needs no additional data.
				}
			else	{
					app.u.throwMessage("Uh oh! unrecognized namespace ["+bindData['var']+"] used for pagetype "+P.pageType+" for navcat "+P.navcat);
					app.u.dump("Uh oh! unrecognized namespace ["+bindData['var']+"] used for pagetype "+P.pageType+" for navcat "+P.navcat);
				}

			}
		} //ends isset(databind).
	}); //ends each



			//app.u.dump(" -> numRequests b4 appPageGet: "+numRequests);
				if(myAttributes.length > 0)	{
					numRequests += app.ext.store_navcats.calls.appPageGet.init({'PATH':catSafeID,'@get':myAttributes});
					}
			//app.u.dump(" -> numRequests AFTER appPageGet: "+numRequests);
//queries are compiled. if a dispatch is actually needed, add a 'ping' to execute callback, otherwise, just execute the callback now.
				if(numRequests > 0)	{
					app.calls.ping.init(tagObj);
					}
				else	{
					app.ext.myRIA.callbacks.showPageContent.onSuccess(tagObj);
					}		

				return numRequests;
				}, //buildQueriesFromTemplate






			showOrderDetails : function(orderID)	{
//				app.u.dump("BEGIN myRIA.u.showOrderDetails");
				var safeID = app.u.makeSafeHTMLId(orderID);
				$orderEle = $('#orderContents_'+safeID);
//if the element is empty, then this is the first time it's been clicked. Go get the data and display it, changing classes as needed.
				if($orderEle.is(':empty'))	{

//app.u.dump(" -> first time viewing order. go get it");
$orderEle.show().addClass('ui-corner-bottom ui-accordion-content-active'); //object that will contain order detail contents.
$orderEle.append(app.renderFunctions.createTemplateInstance('orderContentsTemplate','orderContentsTable_'+safeID))
$('#orderContentsTable_'+safeID).addClass('loadingBG');
if(app.ext.store_crm.calls.buyerPurchaseHistoryDetail.init(orderID,{'callback':'translateTemplate','templateID':'orderContentsTemplate','parentID':'orderContentsTable_'+safeID}))
	app.model.dispatchThis();
	
$orderEle.siblings().addClass('ui-state-active').removeClass('ui-corner-bottom').find('.ui-icon-triangle-1-e').removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');

					}

				else	{
//will only get here if the data is already loaded. show/hide panel and adjust classes.

//app.u.dump("$orderEle.is(':visible') = "+$orderEle.is(':visible'));
if($orderEle.is(':visible'))	{
	$orderEle.removeClass('ui-corner-bottom ui-accordion-content-active').hide();
	$orderEle.siblings().removeClass('ui-state-active').addClass('ui-corner-bottom').find('.ui-icon-triangle-1-s').removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e')
	}
else	{
	$orderEle.addClass('ui-corner-bottom ui-accordion-content-active').show();
	$orderEle.siblings().addClass('ui-state-active').removeClass('ui-corner-bottom').find('.ui-icon-triangle-1-e').removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s')
	}
					}
				

				}, //showOrderDetails
	
			removeByValue : function(arr, val) {
				for(var i=0; i<arr.length; i++) {
					if(arr[i] == val) {
						arr.splice(i, 1);
						break;
						}
					}
				}, //removeByValue





			
/*
commented out on 2012-09-17.
I believe this was updated to the add2buyerlist function but not deleted when it happened?
			handleAddToList : function(pid,listID)	{

//app.u.dump("BEGIN myRIA.u.handleAddToList ("+pid+")");
var authState = app.u.determineAuthentication();
if(authState == 'authenticated')	{
	app.ext.store_crm.calls.addToCustomerList.init({"listid":listID,"sku":pid},{"parentID":"CRMButtonMenu","message":"Item has been added to your list","callback":"showMessaging"}); 
	app.model.dispatchThis();
	}
else	{
	app.ext.myRIA.u.showLoginModal();
	$('#loginMessaging').append("This feature requires you to be logged in.");
	$('#loginSuccessContainer').empty();
	$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Continue').click(function(){
		$('#loginFormForModal').dialog('close');
		app.ext.myRIA.u.handleAddToList(pid,listID);
		}).appendTo($('#loginSuccessContainer'));
	}

				}, //handleAddToList
*/				
//executed in checkout when 'next/submit' button is pushed for 'existing account' after adding an email/password. (preflight panel)
//handles inline validation
			loginFrmSubmit : function(email,password)	{
				var errors = '';
				var $errorDiv = $("#loginMessaging").empty().toggle(false); //make sure error screen is hidden and empty.
				
				if(app.u.isValidEmail(email) == false){
					errors += "Please provide a valid email address<br \/>";
					}
				if(!password)	{
					errors += "Please provide your password<br \/>";
					}
					
				if(errors == ''){
					app.calls.authentication.zoovy.init({"login":email,"password":password},{'callback':'authenticateZoovyUser','extension':'myRIA'});
					app.calls.refreshCart.init({},'immutable'); //cart needs to be updated as part of authentication process.
//					app.ext.store_crm.calls.buyerProductLists.init('forgetme',{'callback':'handleForgetmeList','extension':'store_prodlist'},'immutable');
					
					app.model.dispatchThis('immutable');
					}
				else {
					$errorDiv.toggle(true).append(app.u.formatMessage(errors));
					}
				}, //loginFrmSubmit
			
			
//obj currently supports one param w/ two values:  action: modal|message
			handleAddToCart : function(formID,obj)	{


if(typeof obj != 'object')	{
	obj = {'action':'message'}
	}

//app.u.dump("BEGIN store_product.calls.cartItemsAdd.init")
$('#'+formID+' .atcButton').addClass('disabled').attr('disabled','disabled');
if(!formID)	{
	//app error
	}
else	{
	var pid = $('#'+formID+'_product_id').val();
	if(app.ext.store_product.validate.addToCart(pid))	{
//this product call displays the messaging regardless, but the modal opens over it, so that's fine.
		app.ext.store_product.calls.cartItemsAdd.init(formID,{'callback':'itemAddedToCart','extension':'myRIA'});
		if(obj.action == 'modal')	{
			app.ext.myRIA.u.handleTemplateFunctions({'state':'onInits','templateID':'cartTemplate'}); //oncompletes handled in callback.
			app.ext.store_cart.u.showCartInModal({'showLoading':true});
			app.calls.refreshCart.init({'callback':'handleCart','extension':'myRIA','parentID':'modalCart','templateID':'cartTemplate'},'immutable');
			}
		else	{
			app.calls.refreshCart.init({'callback':'updateMCLineItems','extension':'myRIA'},'immutable');
			}
		app.model.dispatchThis('immutable');
		}
	else	{
		$('#'+formID+' .atcButton').removeClass('disabled').removeAttr('disabled');
		}
	}
return r;				





				}, //handleAddToCart
				
//app.ext.myRIA.u.handleMinicartUpdate();			
			handleMinicartUpdate : function(tagObj)	{
//				app.u.dump("BEGIN myRIA.u.handleMinicartUPdate");
				var r = false; //what's returned. t for cart updated, f for no update.
				if(app.data[tagObj.datapointer])	{
					var $appView = $('#appView');
					r = true;
					var itemCount = app.u.isSet(app.data[tagObj.datapointer].cart['data.item_count']) ? app.data[tagObj.datapointer].cart['data.item_count'] : app.data[tagObj.datapointer].cart['data.add_item_count']
	//				app.u.dump(" -> itemCount: "+itemCount);
	//used for updating minicarts.
					$('.cartItemCount',$appView).text(itemCount);
					var subtotal = app.u.isSet(app.data[tagObj.datapointer].cart['data.order_subtotal']) ? app.data[tagObj.datapointer].cart['data.order_subtotal'] : 0;
					var total = app.u.isSet(app.data[tagObj.datapointer].cart['data.order_total']) ? app.data[tagObj.datapointer].cart['data.order_total'] : 0;
					$('.cartSubtotal',$appView).text(app.u.formatMoney(subtotal,'$',2,false));
					$('.cartTotal',$appView).text(app.u.formatMoney(total,'$',2,false));
					}
				//no error for cart data not being present. It's a passive function.
				return r;
				},

			createTemplateFunctions : function()	{

				app.ext.myRIA.template = {};
				var pageTemplates = new Array('categoryTemplate','productTemplate','companyTemplate','customerTemplate','homepageTemplate','searchTemplate','cartTemplate','checkoutTemplate','pageNotFoundTemplate');
				var L = pageTemplates.length;
				for(var i = 0; i < L; i += 1)	{
					app.ext.myRIA.template[pageTemplates[i]] = {"onCompletes":[],"onInits":[]};
//these will change the cursor to 'wait' and back to normal as each template loads/finishes loading.
					app.ext.myRIA.template[pageTemplates[i]].onInits.push(function(){app.ext.myRIA.u.changeCursor('wait')});
					app.ext.myRIA.template[pageTemplates[i]].onCompletes.push(function(P){
//						app.u.dump("turn of cursor: "+P.templateID);
						app.ext.myRIA.u.changeCursor('auto')
						});
					}

				},
			
//P.state = onCompletes or onInits. later, more states may be supported.
			handleTemplateFunctions : function(P)	{
//				app.u.dump("BEGIN myRIA.u.handleTemplateFunctions");
//				app.u.dump(P);
//in some cases, such as showContent/oninits, we may not 'know' what template is being loaded when this code is executed. try to guess.
				if(!P.templateID)	{
					var couldBeType = this.whatAmIFor(P);
//					app.u.dump(" -> no templateID specified. Try to guess...");
//					app.u.dump(" -> couldBeType: "+couldBeType);
					if(typeof app.templates[couldBeType+"Template"] == 'object')	{
//						app.u.dump(" -> Guessed template: "+couldBeType+"Template (which does exist)");
						P.templateID = couldBeType+"Template"
						P.guessedTemplateID = true;
						}
					}
				
				var r = -1; //what is returned. -1 means not everything was passed in. Otherwise, it'll return the # of functions executed.
				// template[P.templateID][P.state] == 'object' -> this will tell us whether the state passed in is a valid state (more or less)
				if(P.templateID && P.state && typeof app.ext.myRIA.template[P.templateID] == 'object' && typeof app.ext.myRIA.template[P.templateID][P.state] == 'object')	{
//					app.u.dump(" -> templateID and State are present and state is an object.");
					r = 0;
					var FA = app.ext.myRIA.template[P.templateID][P.state]  //FA is Functions Array.
					if(FA.length > 0)	{
						r = true;
						for(var i = 0; i < FA.length; i += 1)	{
							FA[i](P);
							r += 1;
							}
						}
					else	{
						//no action specified for this template/state
						}
					}
				else	{
					app.u.dump("WARNING! Something was not passed into handleTemplateFunctions");
					app.u.dump(" -> template ID: "+P.templateID);
					app.u.dump(" -> state: "+P.state);
//					app.u.dump(" -> typeof app.ext.myRIA.template[P.templateID]:"+ typeof app.ext.myRIA.template[P.templateID]);
//					app.u.dump(P);
					}
//				app.u.dump("END myRIA.u.handleTemplateFunctions");
				return r;
				}, //handleTemplateFunctions 

//htmlObj is 'this' if you add this directly to a form input.
//this function is used in bindAppViewForms
			handleFormField : function(htmlObj)	{
//				app.u.dump("BEGIN myRIA.u.handleFormField.");
				if (htmlObj.defaultValue == htmlObj.value)
					htmlObj.value = "";
				else if(htmlObj.value == '')
					htmlObj.value = htmlObj.defaultValue;
				}, //handleFormField

//for now,classes are hard coded. later, we could support an object here that allows for id's and/or classes to be set
//the selector parameter is optional. allows for the function to be run over  a specific section of html. on init, it's run over #appView
			bindAppViewForms : function(selector)	{
//				app.u.dump("BEGIN myRIA.u.bindAppViewForms");
				selector = selector ? selector+' ' : ''; //default to blank, not undef, to avoid 'undefined' being part of jquery selectors below
//				app.u.dump(" -> selector: '"+selector+"'");
//				app.u.dump(" -> $(selector+' .handleDefault').length: "+$(selector+' .handleDefault').length);

//for any form input in appView where there is default text that should be removed onFocus and re-inserted onBlur (if no text added), assign a class of .handleDefault
				$(selector+'.handleDefault').bind('focus blur',function(event){app.ext.myRIA.u.handleFormField(this)});
		
//				app.u.dump(" -> $(selector+' .productSearchForm').length: "+$(selector+' .productSearchForm').length);

				$(selector+'.productSearchForm').submit(function(event){
					event.preventDefault(); //stops form from actually submitting.
					var P = {}
					P.pageType = 'search';
					P.KEYWORDS = $(this).find('.productSearchKeyword').val();
					showContent('search',P);
					return false;
					});

				$(selector+ '.newsletterSubscriptionForm').submit(function(event){
					event.preventDefault(); //stops form from actually submitting.
					app.ext.store_crm.u.handleSubscribe(this.id);
					return false;
					});

				} //bindAppViewForms

			
			} //util


		
		} //r object.
	return r;
	}