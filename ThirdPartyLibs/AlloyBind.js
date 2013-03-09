/**
 * Created with IntelliJ IDEA.
 * User: jameschow
 * Date: 04/03/2013
 * Time: 10:26
 * To change this template use File | Settings | File Templates.
 */

define(function(require, exports, module) {

    var _ = require('alloy/underscore'), Backbone = require('alloy/backbone');

    var ChainHandler = function(){
        this.chains=[];
        this.composeds = [];
        this.selector = '';
        this.context = undefined;
    };

    ChainHandler.prototype.attachChain = function(chain){
        this.chains.push(chain);
        chain.attachListeners();
        chain.on('all',this.onBChain,this);
    }

    ChainHandler.prototype.getJoinedOutput = function(){
        var output = '';
        _.each(this.composeds,function(composed){
            output += composed();
        });

        return output;
    }

    ChainHandler.prototype.allComplete = function(){
        return _.every(this.composeds,function(composed){
            return (!_.isUndefined(composed()))
        })
    };


    ChainHandler.prototype.onBChain = function(event){
       if (this.fulfilledCallback && this.allComplete())
       {
            this.fulfilledCallback.call(null,this.getJoinedOutput());
       }
        updateElement.call(this,this.getJoinedOutput());
    }

    function updateElement(val){
        if (_.isFunction(this.selector))
        {
            this.selector(val);
        }
    }

    var AlloyBind = function (selector, context){
        return new AlloyBind.fn.init(selector,context);
    };

    AlloyBind.fn = AlloyBind.prototype = {
        uuid:undefined,
        init:function (selector, context){
            this.chainHandler = new ChainHandler();
            this.chainHandler.selector = selector;
            this.chainHandler.context = context;
            return this;
        },
        addChain:function(chain){
            this.chainHandler.attachChain(chain);
            this.chainHandler.composeds.push(chain.getComposed());
            return this;
        },
        setter:function(){
            return _.bind(updateElement,this);
        },
        fulfilled:function(callback,context){
            this.chainHandler.fulfilledCallback = callback;
        }
    }

    AlloyBind.fn.init.prototype = AlloyBind.fn;

    var alloyBind = function(selector){
        var context = this;
        return new AlloyBind(selector,context);
    }

    module.exports = alloyBind;

});