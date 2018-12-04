define(function(require) {
    var QuestionView = require('coreViews/questionView');
    var Adapt = require('coreJS/adapt');
    var timer;
    var timer2;
    var timedMcq = QuestionView.extend({

        events: {
            'inview': 'inview',
            'focus .timedMcq-item input':'onItemFocus',
            'blur .timedMcq-item input':'onItemBlur',
            'change .timedMcq-item input':'onItemSelected',
            'keyup .timedMcq-item input':'onKeyPress',
            'click .timedMcq-time-start' : 'startTimer'
        },

        resetQuestionOnRevisit: function() {
            this.setAllItemsEnabled(true);
            this.resetQuestion();
        },

        setupQuestion: function() {
            // if only one answer is selectable, we should display radio buttons not checkboxes
            this.model.set("_isRadio", (this.model.get("_selectable") == 1));
            
            this.model.set('_selectedItems', []);

            this.setupQuestionItemIndexes();

            this.setupRandomisation();
            
            this.restoreUserAnswers();

        },

        startTimer: function() {
            this.displayQuestions();
            parent = this;
            timer = setInterval(
                    function(){ parent.decreaseTime() } , 1000
                );
        },

        displayQuestions: function() {
            this.$(".timedMcq-widget").css("visibility","visible");
            this.$(".buttons").css("visibility","visible");
            this.$(".timedMcq-body-items").addClass("started");
            this.$(".timedMcq-time-start").addClass("started").prop("disabled", true);
            this.$(".timedMcq-time-instruction").addClass("started");
            this.$(".timedMcq-time").addClass("started");
            this.$(".aria-instruct").removeClass("display-none");
            this.$('.buttons-action').removeClass("disabled").prop("disabled", false);
            $(".timedMcq-time-start").addClass("disabled").prop("disabled", true); //THIS LOCKES OTHER QUESTIONS UNTIL THIS ONE IS ANSWERED
        },

        checkTimeUp: function(){
            if(this.model.get('_seconds') > 0 ) {
                return false;
            }else{
                if ( $(".timedMcq-component").hasClass( "enabledimgtime" ) && !$(".timedMcq-component").hasClass( "embedimgtimeup" ) ) {
                    //don't do anything
                    $(".timedMcq-time-start").addClass("disabled").prop("disabled", true); //THIS LOCKES IMAGE TIMED QUESTIONS
                } else {
                    $(".timedMcq-time-start").removeClass("disabled").prop("disabled", false); //THIS UNLOCKES OTHER QUESTIONS
                    this.$( '.timedMcq-time' ).attr("tabindex","0").attr("aria-label","time left to answer 0 seconds").text( '0' );
                }
            }
            return true;
        },

        stopTimer: function(){
            clearInterval(timer);
        },

        stopTimer2: function(){
            clearInterval(timer2);
        },

        decreaseTime: function(){
            var seconds = this.model.get("_seconds");
            this.model.set("_seconds", --seconds);
            this.$(".timedMcq-time").attr("tabindex","0").attr("aria-label","time left to answer "+seconds+" seconds").text(seconds); //Made the timer accessible
            if(this.checkTimeUp()) {
                this.disableQuestion(); 
            }
        },

        inview: function(event, visible, visiblePartX, visiblePartY) {
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;
                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                    this.stopTimer2();
                    this.setupInitialimgTimer();
                }

                if (this._isVisibleTop && this._isVisibleBottom) {
                    this.$('.component-widget').off('inview');
                }

            }
        },

        decreaseTime2: function(setupInView){
            var seconds = this.model.get("_seconds");
            var currentimedmcq = this.model.get('_id');

            $("." + currentimedmcq + ".enabledimgtime .timedMcq-time").addClass("imgcounton");
            $("." + currentimedmcq + ".enabledimgtime .timedMcq-widget").css("visibility","visible");
            $(".enabledimgtime .timedMcq-body-items").removeClass("started");
            $(".enabledimgtime .timedMcq-time-start").removeClass("started").prop("disabled", false);
            $(".enabledimgtime .timedMcq-time-instruction").removeClass("started");
            $(".enabledimgtime .timedMcq-time").removeClass("display-none").removeClass("started");
            $(".enabledimgtime .aria-instruct").addClass("display-none");
            $(".enabledimgtime .timedMcq-time-start").addClass("disabled").prop("disabled", true); //THIS LOCKES OTHER QUESTIONS UNTIL THIS ONE IS ANSWERED  

            this.model.set("_seconds", --seconds);
            $("." + currentimedmcq + " .timedMcq-time").attr("tabindex","0").attr("aria-label","time left to answer "+seconds+" seconds").text(seconds); //Made the timer accessible 
            if (seconds <= 0) {
                // On Countdown finish do this
               this.stopTimer2();
                $("." + currentimedmcq + ".timedMcq-component").addClass("embedimgtimeup");
                $("." + currentimedmcq + ".embedimgtimeup .timedMcq-widget").css("visibility","visible");
                $("." + currentimedmcq + ".embedimgtimeup .timedMcq-body-items").addClass("started");
                $("." + currentimedmcq + ".embedimgtimeup .timedMcq-time-start").addClass("started").prop("disabled", true);
                $("." + currentimedmcq + ".embedimgtimeup .timedMcq-time-instruction").addClass("started");
                $("." + currentimedmcq + ".embedimgtimeup .timedMcq-time").addClass("display-none").addClass("started").text( "0" );
                $("." + currentimedmcq + ".embedimgtimeup .aria-instruct").removeClass("display-none");
                $("." + currentimedmcq + ".embedimgtimeup .buttons-action").removeClass("disabled").prop("disabled", false);
                $("." + currentimedmcq + ".embedimgtimeup .timedMcq-item input").removeClass("disabled").prop("disabled", false);
                $(".enabledimgtime .timedMcq-time-start").addClass("disabled").prop("disabled", true);//THIS LOCKES TIMED IMAGE QUESTIONS
            }
        },

        setupQuestionItemIndexes: function() {
            var items = this.model.get("_items");
            for (var i = 0, l = items.length; i < l; i++) {
                if (items[i]._index === undefined) items[i]._index = i;
            }
        },

        setupRandomisation: function() {
            if (this.model.get('_isRandom') && this.model.get('_isEnabled')) {
                this.model.set("_items", _.shuffle(this.model.get("_items")));
            }
        },

        setupInitialimgTimer: function() {

            if (this.model.get('_timedimgEnabled') && this.model.get('_isEnabled')) {
                
                var currentimedmcq = this.model.get('_id');

                if (  $("." + currentimedmcq + " .timedMcq-widget").hasClass( "submitted" ) || $("." + currentimedmcq + " .timedMcq-widget").hasClass( "complete" ) ) {
                    
                    $("." + currentimedmcq + " .timedMcq-time" ).addClass("display-none").addClass("started").attr("tabindex","0").attr("aria-label","time left to answer 0 seconds").text( "0" );
                    $(".embedimgtimeup .timedMcq-time-start").removeClass("disabled").prop("disabled", false); //UNLOCKS FOR TIMED IMAGE COMPLETE
                
                    this.decreaseTime2();

                } else {
                    
                    parent2 = this
                    timer2 = setInterval(
                            function(){ parent2.decreaseTime2() } , 1000
                    );
                }

            } else {
                 //NOT Timed image
            }
            //var timerimgraphic = this.model.get("_graphic");
        },

        restoreUserAnswers: function() {
            if (!this.model.get("_isSubmitted")) return;

            var selectedItems = [];
            var items = this.model.get("_items");
            var userAnswer = this.model.get("_userAnswer");
            _.each(items, function(item, index) {
                item._isSelected = userAnswer[item._index];
                if (item._isSelected) {
                    selectedItems.push(item)
                }
            });

            this.model.set("_selectedItems", selectedItems);

            this.setQuestionAsSubmitted();
            this.markQuestion();
            this.setScore();
            this.showMarking();
            this.setupFeedback();
        },

        disableQuestion: function() {
            this.stopTimer();
            if(this.checkTimeUp()){
                this.timeUp();
            }
            this.setAllItemsEnabled(false);
        },

        enableQuestion: function() {
            this.setAllItemsEnabled(true);
        },

        timeUp(){
            var currentimedmcq = this.model.get('_id');

            if (  $("." + currentimedmcq + ".timedMcq-component").hasClass( "embedimgtimeup" ) ) {
                $("." + currentimedmcq + ".embedimgtimeup .buttons-action").removeClass("disabled").prop("disabled", false);
            } else {
                this.setupTimeUpFeedback();
                this.model.set('_isCorrect', false);
                $("." + currentimedmcq + ".timedMcq-component .buttons-action").prop("disabled", true);
                this.showMarking();
                Adapt.trigger('questionView:showFeedback', this);
                this.updateButtons();
            }
        },

        setAllItemsEnabled: function(isEnabled) {
            _.each(this.model.get('_items'), function(item, index){
                var $itemLabel = this.$('label').eq(index);
                var $itemInput = this.$('input').eq(index);

                if (isEnabled) {
                    $itemLabel.removeClass('disabled');
                    $itemInput.prop('disabled', false);
                } else {
                    $itemLabel.addClass('disabled');
                    $itemInput.prop('disabled', true);
                }
            }, this);
        },

        onQuestionRendered: function() {
            this.setReadyStatus();

            var seconds = this.model.get("_seconds");
            var currentimedmcq = this.model.get('_id');
            
            if (this.model.get('_timedimgEnabled') && this.model.get('_isEnabled')) {
                $("." + currentimedmcq + ".timedMcq-component").addClass("enabledimgtime");
                $(".enabledimgtime .timedMcq-time-start").addClass("disabled").prop("disabled", true); //LOCKS ALL TIMED IMAGES
            }

            if (  this.$(".timedMcq-widget").hasClass( "submitted" ) || this.$(".timedMcq-widget").hasClass( "complete" ) ) {
                
                this.$( '.timedMcq-time' ).attr("tabindex","0").attr("aria-label","time left to answer 0 seconds").text( '0' );
                
                window.setTimeout(function(){
                    this.$( ".embedimgtimeup .timedMcq-widget").css("visibility","visible");
                    this.$( ".embedimgtimeup .buttons").css("visibility","visible");
                    this.$( ".embedimgtimeup .timedMcq-body-items").addClass("started");
                    this.$( ".embedimgtimeup .timedMcq-time-start").addClass("started").prop("disabled", true);
                    this.$( ".embedimgtimeup .timedMcq-time-instruction").addClass("started");
                    this.$( ".embedimgtimeup .timedMcq-time").addClass("display-none").addClass("started").text( "0" );
                    this.$( ".embedimgtimeup .aria-instruct").removeClass("display-none");
                    this.$( ".embedimgtimeup .buttons-action").removeClass("disabled").prop("disabled", false);
                    this.$( ".embedimgtimeup .timedMcq-item input").removeClass("disabled").prop("disabled", false);
                }, 233);
            }

            //BELOW DISPLAYS ANSWERS OR TIME UP RESPONSE ON REVISIT
            if ( $("." + currentimedmcq + ".timedMcq-component").hasClass( "enabledimgtime" ) ) {
                if (seconds <= 0) {
                    $(".enabledimgtime .timedMcq-widget").css("visibility","visible");
                    $(".enabledimgtime .timedMcq-body-items").addClass("started");
                    $(".enabledimgtime .buttons").css("visibility","visible");
                    $(".enabledimgtime .timedMcq-time-start").addClass("display-none");
                    $(".enabledimgtime .timedMcq-time-instruction").addClass("started");
                    $(".enabledimgtime .timedMcq-time").removeClass("display-none").removeClass("started");
                    $(".enabledimgtime .aria-instruct").addClass("display-none");
                }
            } else if ( this.$( ".timedMcq-time" ).text() == "0" ) {
                $("." + currentimedmcq + ".timedMcq-component").addClass("timeuplock");
                $("." + currentimedmcq + ".timeuplock .timedMcq-body-items").addClass("started");
                $("." + currentimedmcq + ".timeuplock .timedMcq-time-start").addClass("started").prop("disabled", true);
                 window.setTimeout(function(){
                    $("." + currentimedmcq + ".timeuplock .timedMcq-item input").addClass("disabled").prop("disabled", true);
                    $("." + currentimedmcq + ".timeuplock .timedMcq-item label").addClass("disabled").prop("disabled", true);
                    $("." + currentimedmcq + ".timeuplock .buttons-action").addClass("disabled").prop("disabled", true);
                }, 253);
                $("." + currentimedmcq + ".timeuplock .timedMcq-time-instruction").addClass("started");
                $("." + currentimedmcq + ".timeuplock .aria-instruct").removeClass("display-none");
            }
        },

        onKeyPress: function(event) {
            if (event.which === 13) { //<ENTER> keypress
                this.onItemSelected(event);
            }
        },

        onItemFocus: function(event) {
            if(this.model.get('_isEnabled') && !this.model.get('_isSubmitted')){
                $("label[for='"+$(event.currentTarget).attr('id')+"']").addClass('highlighted');
            }
        },
        
        onItemBlur: function(event) {
            $("label[for='"+$(event.currentTarget).attr('id')+"']").removeClass('highlighted');
        },

        onItemSelected: function(event) {
            if(this.model.get('_isEnabled') && !this.model.get('_isSubmitted')){
                var selectedItemObject = this.model.get('_items')[$(event.currentTarget).parent('.component-item').index()];
                this.toggleItemSelected(selectedItemObject, event);
            }
        },

        toggleItemSelected:function(item, clickEvent) {
            var selectedItems = this.model.get('_selectedItems');
            var itemIndex = _.indexOf(this.model.get('_items'), item),
                $itemLabel = this.$('label').eq(itemIndex),
                $itemInput = this.$('input').eq(itemIndex),
                selected = !$itemLabel.hasClass('selected');
            
                if(selected) {
                    if(this.model.get('_selectable') === 1){
                        this.$('label').removeClass('selected');
                        this.$('input').prop('checked', false);
                        this.deselectAllItems();
                        selectedItems[0] = item;
                    } else if(selectedItems.length < this.model.get('_selectable')) {
                     selectedItems.push(item);
                 } else {
                    clickEvent.preventDefault();
                    return;
                }
                $itemLabel.addClass('selected');
                $itemLabel.a11y_selected(true);
            } else {
                selectedItems.splice(_.indexOf(selectedItems, item), 1);
                $itemLabel.removeClass('selected');
                $itemLabel.a11y_selected(false);
            }
            $itemInput.prop('checked', selected);
            item._isSelected = selected;
            this.model.set('_selectedItems', selectedItems);
        },

        // check if the user is allowed to submit the question
        canSubmit: function() {
            var count = 0;
            var currentimedmcq = this.model.get('_id');

            _.each(this.model.get('_items'), function(item) {
                if (item._isSelected) {
                    count++;
                }
            }, this);

            $(".timedMcq-time-start").removeClass("disabled").prop("disabled", false); //THIS UNLOCKES OTHER QUESTIONS
            
            return (count >= 0) ? true : false;

        },

        // Blank method to add functionality for when the user cannot submit
        // Could be used for a popup or explanation dialog/hint
        onCannotSubmit: function() {},

        // This is important for returning or showing the users answer
        // This should preserve the state of the users answers
        storeUserAnswer: function() {
            var userAnswer = [];

            var items = this.model.get('_items').slice(0);
            items.sort(function(a, b) {
                return a._index - b._index;
            });

            _.each(items, function(item, index) {
                userAnswer.push(item._isSelected);
            }, this);
            this.model.set('_userAnswer', userAnswer);


        },

        isCorrect: function() {

            var numberOfRequiredAnswers = 0;
            var numberOfCorrectAnswers = 0;
            var numberOfIncorrectAnswers = 0;

            _.each(this.model.get('_items'), function(item, index) {

                var itemSelected = (item._isSelected || false);

                if (item._shouldBeSelected) {
                    numberOfRequiredAnswers ++;

                    if (itemSelected) {
                        numberOfCorrectAnswers ++;
                        
                        item._isCorrect = true;

                        this.model.set('_isAtLeastOneCorrectSelection', true);
                    }

                } else if (!item._shouldBeSelected && itemSelected) {
                    numberOfIncorrectAnswers ++;
                }

            }, this);

            this.model.set('_numberOfCorrectAnswers', numberOfCorrectAnswers);
            this.model.set('_numberOfRequiredAnswers', numberOfRequiredAnswers);

            // Check if correct answers matches correct items and there are no incorrect selections
            var answeredCorrectly = (numberOfCorrectAnswers === numberOfRequiredAnswers) && (numberOfIncorrectAnswers === 0);
            return answeredCorrectly;
        },

        // Sets the score based upon the questionWeight
        // Can be overwritten if the question needs to set the score in a different way
        setScore: function() {
            var questionWeight = this.model.get("_questionWeight");
            var answeredCorrectly = this.model.get('_isCorrect');
            var score = answeredCorrectly ? questionWeight : 0;
            this.model.set('_score', score);
        },

        setupFeedback: function() {

            if (this.model.get('_isCorrect')) {
                this.setupCorrectFeedback();
            } else if (this.isPartlyCorrect()) {
                this.setupPartlyCorrectFeedback();
            } 
             else {
                // apply individual item feedback
                if((this.model.get('_selectable') === 1) && this.model.get('_selectedItems')[0].feedback) {
                    this.setupIndividualFeedback(this.model.get('_selectedItems')[0]);
                    return;
                } else {
                    this.setupIncorrectFeedback();
                }
            }
            $(".enabledimgtime .timedMcq-time-start").addClass("disabled").prop("disabled", true);//THIS LOCKES TIMED IMAGE QUESTIONS
        },

        setupTimeUpFeedback: function() {
             this.model.set({
                feedbackTitle: this.model.get('title'),
                feedbackMessage: this.model.get("_feedback").timeUp
             });
             $(".enabledimgtime .timedMcq-time-start").addClass("disabled").prop("disabled", true);//THIS LOCKES TIMED IMAGE QUESTIONS
        },

        setupIndividualFeedback: function(selectedItem) {
             this.model.set({
                 feedbackTitle: this.model.get('title'),
                 feedbackMessage: selectedItem.feedback
             });
             $(".enabledimgtime .timedMcq-time-start").addClass("disabled").prop("disabled", true);//THIS LOCKES TIMED IMAGE QUESTIONS
        },

        // This is important and should give the user feedback on how they answered the question
        // Normally done through ticks and crosses by adding classes
        showMarking: function() {
            _.each(this.model.get('_items'), function(item, i) {
                var $item = this.$('.component-item').eq(i);
                $item.removeClass('correct incorrect').addClass(item._isCorrect ? 'correct' : 'incorrect');
            }, this);
        },

        isPartlyCorrect: function() {
            return this.model.get('_isAtLeastOneCorrectSelection');
        },

        resetUserAnswer: function() {
            this.model.set({_userAnswer: []});
        },

        // Used by the question view to reset the look and feel of the component.
        resetQuestion: function() {

            this.deselectAllItems();
            this.resetItems();
        },

        deselectAllItems: function() {
            this.$el.a11y_selected(false);
            _.each(this.model.get('_items'), function(item) {
                item._isSelected = false;
            }, this);
        },

        resetItems: function() {
            this.$('.component-item label').removeClass('selected');
            this.$('.component-item').removeClass('correct incorrect');
            this.$('input').prop('checked', false);
            this.model.set({
                _selectedItems: [],
                _isAtLeastOneCorrectSelection: false
            });
        },

        showCorrectAnswer: function() {
            _.each(this.model.get('_items'), function(item, index) {
                this.setOptionSelected(index, item._shouldBeSelected);
            }, this);
        },

        setOptionSelected:function(index, selected) {
            var $itemLabel = this.$('label').eq(index);
            var $itemInput = this.$('input').eq(index);
            if (selected) {
                $itemLabel.addClass('selected');
                $itemInput.prop('checked', true);
            } else {
                $itemLabel.removeClass('selected');
                $itemInput.prop('checked', false);
            }
        },

        hideCorrectAnswer: function() {
            _.each(this.model.get('_items'), function(item, index) {
                this.setOptionSelected(index, this.model.get('_userAnswer')[item._index]);
            }, this);
        },

        /**
        * used by adapt-contrib-spoor to get the user's answers in the format required by the cmi.interactions.n.student_response data field
        * returns the user's answers as a string in the format "1,5,2"
        */
        getResponse:function() {
            var selected = _.where(this.model.get('_items'), {'_isSelected':true});
            var selectedIndexes = _.pluck(selected, '_index');
            // indexes are 0-based, we need them to be 1-based for cmi.interactions
            for (var i = 0, count = selectedIndexes.length; i < count; i++) {
                selectedIndexes[i]++;
            }
            return selectedIndexes.join(',');
        },

        /**
        * used by adapt-contrib-spoor to get the type of this question in the format required by the cmi.interactions.n.type data field
        */
        getResponseType:function() {
            return "choice";
        }

    });

    Adapt.register("timedMcq", timedMcq);

    return timedMcq;
});
