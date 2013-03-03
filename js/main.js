
(function(window,document,Backbone,_,undefined){

    var _holder = {};

    function onBChain(event){
        updateElement.call(this,this.getComposed()());
    }

    function updateElement(val){
        var element = document.getElementById(_holder[this].selector);
        element.innerHTML = val
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
                    chain.attachListeners();
                    chain.on('all',onBChain,chain);
                }
            }
            return this;
        },
        addBChain:function(chain){
            _holder[this].chainHandler.attachChain(chain);
            return this;
        },
        setter:function(){
            return _.bind(updateElement,this);
        }
    }

})(this, this.document, Backbone, _);


(function(window,document,Backbone,_,undefined){

    var _chain = {};

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

    window.bChain = bChain = function(eventedModel){
        var context = this;
        return new BChain(eventedModel,context);
    }

    var BChain = function (eventedModel, context){
        _chain[this] = [];

        return BChain.fn.init(eventedModel,context);
    };

    BChain.fn = BChain.prototype = {
        init:function (eventedModel, context){

            //making this an observable
            _.extend(this, Backbone.Events);


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
            if (collection instanceof Backbone.Collection){
                _chain[this].unshift(new CollectionWatcher(collection));
            }
            return this;
        },
        model:function(model){
            if (model instanceof Backbone.Model){
                _chain[this].unshift(new ModelWatcher(model));
            }
            return this;
        },
        get:function(property){
            if (_.isString(property)){
                _chain[this].unshift(new PropertyWatcher(property));
            }
            return this;
        },
        at:function(index){
            if (_.isNumber(index)){
                _chain[this].unshift(new IndexWatcher(index));
            }
            return this;
        },
        transform:function(transform){
            if (_.isFunction(transform)){
                _chain[this].unshift(new TransformWatcher(transform));
            }
            return this;
        },
        brokenChainEndValue:function(emptyValue){
            _chain[this].unshift(new EmptyTransformWatcher(emptyValue))
            return this;
        },
        getComposed:function(){
            var partials = _.pluck(_chain[this], 'partial');

            return _.compose.apply(this,partials);
        },
        attachListeners:function(){
            eventHandler.attachListeners(_chain[this],this);
            return this;
        },
        query:function(query,context){
            var list = query.split(".");
            var self = this;
            _.each(list,function(item,idx){
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

})(this, this.document, Backbone, _);

var library = new Backbone.Collection([{name:'feersum',author:'banks'}]);

//var authored = bChain(library).at(2).get("author").brokenChainEndValue('').getComposed();
//bChain(library).at(2).get('name').transform(function(item){return item+" "+authored()}).on('all');
//bChain().query('library[2].addresses[1].street',this);
tQuery('output').addBChain(bChain('library[2].addresses[0].street').brokenChainEndValue('cannot find'));

setTimeout(function(){
    library.add({name:'use of weapons',author:'banks'});
},1000);
setTimeout(function(){
    library.add({name:'state of the art',author:'banks',addresses:[{street:'unicorn road'}]});
},2000);