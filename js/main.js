
(function(window,document,Backbone,_,undefined){

    var _holder = {};

    function updateElement(){
        var element = document.getElementById(_holder[this].selector);
        element.innerHTML = this.getComposed()();
    }

    window.tQuery = tQuery = function(selector,context){
        return new TQuery(selector,context);
    }

    var TQuery = function (selector, context){
        return TQuery.fn.init(selector,context);
    };

    TQuery.fn = TQuery.prototype = {
        init:function (selector, context){
            _holder[this] = {};
            _holder[this].selector = selector;
            _holder[this].chainHandler = {
                chains:[],
                attachChain:function(chain){
                    this.chains.push(chain);
                    chain.on('all',updateElement,chain);
                }
            }
            return this;
        },
        addBChain:function(chain){
            _holder[this].chainHandler.attachChain(chain);
            return this;
        },
        forceBind:function(){
            updateElement();
            return this;
        }
    }

})(this, this.document, Backbone, _);


(function(window,document,Backbone,_,undefined){

    var _chain = {}

    var processes = {
        property:function(property,model) {
            return (model !== undefined && model instanceof Backbone.Model) ? model.get(property) : undefined;
        },
        index:function(index,collection){
            return (collection !== undefined && collection instanceof Backbone.Collection) ? collection.at(index) : undefined;
        },
        collection:function(collection,item){
            return collection;
        },
        model:function(model,item){
            return model;
        },
        transform:function(func,item){
            return (item !== undefined && _.isFunction(func)) ? func(item) : undefined;
        }
    }

    var chainHandler = {
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
        }
    }

    window.bChain = bChain = function(eventedModel,context){
        return new BChain(eventedModel,context);
    }

    var BChain = function (eventedModel, context){
        _chain[this] = [];

        return BChain.fn.init(eventedModel,context);
    };

    BChain.fn = BChain.prototype = {
        init:function (eventedModel, context){

            _.extend(this, Backbone.Events);

            //see if we are starting with a collection of model

            if (eventedModel instanceof Backbone.Collection){
                this.collection(eventedModel);
            }
            else if (eventedModel instanceof Backbone.Model){
                this.model(eventedModel);
            }

            return this;
        },
        collection:function(collection){
            if (collection instanceof Backbone.Collection){
                _chain[this].unshift(_.partial(processes.collection, collection));

                chainHandler.attachCollectionListener(collection,this);
            }
            return this;
        },
        model:function(model){
            if (model instanceof Backbone.Model){
                _chain[this].unshift(_.partial(processes.model, model));
                chainHandler.attachModelListener(model,this);
            }
            return this;
        },
        get:function(property){
            if (_.isString(property)){
                _chain[this].unshift(_.partial(processes.property, property));
            }
            return this;
        },
        at:function(index){
            if (_.isNumber(index)){
                _chain[this].unshift(_.partial(processes.index, index));
            }
            return this;
        },
        transform:function(transform){
            if (_.isFunction(transform)){
                _chain[this].unshift(_.partial(processes.transform, transform));
            }
            return this;
        },
        getComposed:function(){
            return _.compose.apply(this,_chain[this]);
        }
    }

})(this, this.document, Backbone, _);

var library = new Backbone.Collection([{name:'feersum',author:'banks'}]);

var authored = bChain(library).at(2).get("author").getComposed();
bChain(library).at(2).get('name').transform(function(item){return item+authored()});

tQuery('output').addBChain(bChain(library).at(2).get('name'));

setTimeout(function(){
    library.add({name:'use of weapons',author:'banks'});
},3000);
setTimeout(function(){
    library.add({name:'state of the art',author:'banks'});
},6000);