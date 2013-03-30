
requirejs.config({

    //setup paths and dependancies
    paths: {
        "alloy/backbone": "alloy/backbone",
        "alloy/underscore": "alloy/underscore"
    }
    ,
    //ensure libs load upstream libs
    shim: {
        'alloy/backbone': {
            deps: ['alloy/underscore'],
            exports: 'Backbone'
        },
        'alloy/underscore': {
            exports: '_'
        }
    }
});


requirejs(['alloy/backbone','ThirdPartyLibs/AlloyBind','ThirdPartyLibs/BackboneChain'],
    function   (Backbone,        AlloyBind,   BackboneChain) {
        library = new Backbone.Collection([{name:'feersum',author:'banks'}]);
        this.library = library;
        //var authored = bChain(library).at(2).get("author").brokenChainEndValue('').getComposed();
        //bChain(library).at(2).get('name').transform(function(item){return item+" "+authored()}).on('all');
        //bChain().query('library[2].addresses[1].street',this);

        var ab = AlloyBind.factory
        var bc = BackboneChain.factory;

        var updateOutput = function(value){document.getElementById('output').innerHTML=value};

        ab(updateOutput)
            .addChain(bc('library[2].addresses[0].street'))
            .addChain(bc('library[2].addresses[0].postcode'))
            .fulfilled(function(value){document.getElementById('output2').innerHTML=value});

        set(function(){
            library.add({name:'use of weapons',author:'banks'});
        },1000);
        setTimeout(function(){
            library.add({name:'state of the art',author:'banks',addresses:[{street:'unicorn road',postcode:'somewhere'}]});
        },2000);
    });



