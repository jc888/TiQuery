/**
 * Created with IntelliJ IDEA.
 * User: jameschow
 * Date: 04/03/2013
 * Time: 10:28
 * To change this template use File | Settings | File Templates.
 */
define(function(require, exports, module) {

    var _ = require('alloy/underscore'), Backbone = require('alloy/backbone');

    var _internal = {};

    var chainStorage = {
        PropertyWatcher:function(property,model) {
            if (model !== undefined && model instanceof Backbone.Model){
                //backbone model
                return model.get(property)
            }
            else if (model !== undefined && _.has(model,property))
            {
                //array item
                return model[property];
            }

            return undefined;
        },
        IndexWatcher:function(index,collection){
            if (collection !== undefined && collection instanceof Backbone.Collection){
                //backbone collection
                return collection.at(index)
            }
            else if (collection !== undefined && _.isArray(collection))
            {
                //array item
                return collection[index];
            }

            return undefined;
        },
        CollectionWatcher:function(collection,item){
            return collection;
        },
        ModelWatcher:function(model,item){
            return model;
        },
        TransformWatcher:function(func,item){
            return (item !== undefined && _.isFunction(func)) ? func(item) : undefined;
        },
        EmptyTransformWatcher:function(emptyvalue,item){
            return (item !== undefined) ? item : emptyvalue;
        }
    }

    var PropertyWatcher = function(property){
        this.property = property;
        this.partial = _.partial(chainStorage.PropertyWatcher,property);
    }

    var IndexWatcher = function(index){
        this.index = index;
        this.partial = _.partial(chainStorage.IndexWatcher,index);
    }

    var CollectionWatcher = function(collection){
        this.collection = collection;
        this.partial = _.partial(chainStorage.CollectionWatcher,collection);
    }

    var ModelWatcher = function(model){
        this.model = model;
        this.partial = _.partial(chainStorage.ModelWatcher,model);
    }

    var TransformWatcher = function(transform){
        this.transform = transform;
        this.partial = _.partial(chainStorage.TransformWatcher,transform);
    }

    var EmptyTransformWatcher = function(emptyValue){
        this.emptyValue = emptyValue;
        this.partial = _.partial(chainStorage.EmptyTransformWatcher,emptyValue);
    }

    var eventHandler = {
        listenedModels:[],
        onCollectionEvent: function(event){
            this.trigger(event);
        },
        attachCollectionListener:function(collection,context){
            if (collection instanceof Backbone.Collection){
                //store that the listened model
                this.listenedModels.push(collection);
                collection.on('all',this.onCollectionEvent,context);
            }
        },
        attachModelListener:function(model,context){
            if (model instanceof Backbone.Model){
                //store that the listened model
                this.listenedModels.push(model);
                model.on('all',this.onCollectionEvent,context);
            }
        },
        attachListeners:function(list,context){
            var self = this;
            _.each(list,function(item){
                if (item instanceof CollectionWatcher)
                {
                    self.attachCollectionListener(item.collection,context);
                }
                if (item instanceof ModelWatcher)
                {
                    self.attachModelListener(item.model,context);
                }
            });
        },
        detachListeners:function(){
            var self = this;
            _.each(self.listenedModels,function(item){
                item.off();
            });
        }
    }

    var ChainHandler = function() {
        var chain = [];
        this.addWatcher = function(watcher){
            chain.unshift(watcher);
        }
        this.getPartials = function() {
            return _.pluck(chain, 'partial');
        }
        this.getChain = function(){
            return chain;
        }
    }

    var BackboneChain = function (eventedModel, context){

        return new BackboneChain.fn.init(eventedModel,context);
    };

    BackboneChain.fn = BackboneChain.prototype = {
        uuid:'',
        init:function (eventedModel, context){

            //making this an observable
            _.extend(this, Backbone.Events);

            _internal[this.uuid] = new ChainHandler();

            if (eventedModel instanceof Backbone.Collection){
                //see if we are starting with a collection
                this.collection(eventedModel);
            }
            else if (eventedModel instanceof Backbone.Model){
                //see if we are starting with a model
                this.model(eventedModel);
            }
            else if (_.isString(eventedModel)){
                //see if we are starting with a selector query
                this.query(eventedModel,context);
            }

            return this;
        },
        collection:function(collection){
            var chainHandler = _internal[this.uuid];
            if (collection instanceof Backbone.Collection){
                chainHandler.addWatcher(new CollectionWatcher(collection));
            }
            return this;
        },
        model:function(model){
            var chainHandler = _internal[this.uuid];

            if (model instanceof Backbone.Model){
                chainHandler.addWatcher(new ModelWatcher(model));
            }
            return this;
        },
        get:function(property){
            var chainHandler = _internal[this.uuid];

            if (_.isString(property)){
                chainHandler.addWatcher(new PropertyWatcher(property));
            }
            return this;
        },
        at:function(index){
            var chainHandler = _internal[this.uuid];

            if (_.isNumber(index)){
                chainHandler.addWatcher(new IndexWatcher(index));
            }
            return this;
        },
        transform:function(transform){
            var chainHandler = _internal[this.uuid];

            if (_.isFunction(transform)){
                chainHandler.addWatcher(new TransformWatcher(transform));
            }
            return this;
        },
        brokenChainEndValue:function(emptyValue){
            var chainHandler = _internal[this.uuid];

            chainHandler.addWatcher(new EmptyTransformWatcher(emptyValue))
            return this;
        },
        getComposed:function(){
            var chainHandler = _internal[this.uuid];

            var partials = chainHandler.getPartials()

            return _.compose.apply(this,partials);
        },
        attachListeners:function(){
            var chainHandler = _internal[this.uuid];

            eventHandler.attachListeners(chainHandler.getChain(),this);
            return this;
        },
        getValue:function(){
            return this.getComposed()();
        },
        query:function(query,context){
            var list = query.split(".");
            var self = this;
            _.each(list, function(item,idx){
                var variableName = item;
                var atSymbol = /[\d+]/.exec(item);
                if (!_.isNull(atSymbol)){
                    variableName  = item.substr(0,atSymbol.index-1);
                }

                if ( idx == 0 )
                {
                    self.collection(context[variableName]);
                }
                else
                {
                    self.get(variableName);
                }

                if (!_.isNull(atSymbol)){
                    var index = parseInt(atSymbol.toString());
                    self.at(index);
                }
            });
            return this;
        }
    }

    BackboneChain.fn.init.prototype = BackboneChain.fn;

    var backboneChain = function (eventedModel){

        var context = this;

        return new BackboneChain.fn.init(eventedModel,context);
    };

    module.exports = backboneChain;

});
