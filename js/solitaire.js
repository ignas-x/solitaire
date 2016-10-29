/*
// TO DO(+bugs):
//

- remove velocity ?
- add foundations cells highlight class check to updateAll() also
- do not allow multiple cards drop to foundation at once
- add animation end pause, before deck reverse
- sometimes cards dragged from foundation cells doesn't return back correctly
- Add Cell highlight when King is dragged over
- Make to open 3 reverse cards from deck, but just top card is usable (if first moved user can drag second)
- Add user name support (pass from New Game dialog -> Congrats)
- Card deal animation is lame (also some cards migrate to left side)
- Add more cards animation (shuffle, deal, final salute)
- Disable ability to grab underneath card when moving/returning top card
- Deck cards was offseted 3px to left... WHY ?!?!?!
- Add bg-images for Deck and Foundation cells ???
- Add Undo ???
- Add Cheat mode ???


--------------------------------
--------------------------------
Cards naming:
--------------------------------
card_1_12.jpg
(Queen(12) of Hearts(1))

Hearts   - 1
Diamonds - 2
Clubs    - 3
Spades   - 4

Ace      - 1
2-10     - 2-10
Jack     - 11
Queen    - 12
King     - 13
-------------------------------
*/
// GLOBAL VARIABLES

var correctCards = 0;
var cardsDeck = [];
var offsetY = 30; 		// card Y offset size (px) when placing one over top of other
var mouseX, mouseY;
var deltaX=0, deltaY=0; // for dragging helper 
var $oldParent; 		// place to return to it after bad drop
var dropSuccess = false;// return card to parent
var cardsToReverse = 1; // or 3 (on deck click)

$(document).mousemove(function(event) { 
	        mouseX = event.pageX;
  			mouseY = event.pageY;
});

function openHelpModal(){
	$('#HelpModal').modal('show');
}

function openNewGameModal(){
	$('#NewGameModal').modal('show');
}

function newGameInit(){
	$('.foundation-cells').removeClass('lightUp');
	cardDeckShuffle();
	collectCards();
	cardDeckShuffle();
    dealCards();
    addDeckCardClick();
	addDeckReverse();
    updateAll();
    recalculateAbsolutes();
}

function updateAll(){
    openLastCards();
	updateCells();
	checkFoundations();
	$('#mouse_div2').offset($('body').offset());	
}

function win(){
	$.fx.speeds._default = 2000;
	for (var i=0; i < cardsDeck.length; i++) {

		var card_id = '#' + getCardId(i+1);
		var foundation_id = '#fcell' + $(card_id).data('color');

		openCard($(card_id));

		var parentX = $(foundation_id).offset().left;
		var parentY = $(foundation_id).offset().top;
		$(card_id).css("position", "absolute");
		$(card_id).css($(foundation_id).offset());
		//$(foundation_id).append($(card_id));
		moveAnimate($(card_id), $(foundation_id));
		var xx = $(foundation_id).children().length/2;
		var yy = xx/2;
		$(card_id).transition({ x: '+='+xx+'px', y: '+='+yy+'px' });
	}
	$.fx.speeds._default = 300;
	updateAll();
}

function collectCards(){
	for (var i=0; i < cardsDeck.length; i++) {

		var card_id = '#' + getCardId(cardsDeck[i]);
		var card = $(card_id);
		//var foundation_id = '#fcell' + $(card_id).data('color');

		closeCard($(card_id));

		card.data('indeck', true);
		card.unbind('click');
		card.css('z-index', 1);
		card.css('transform','');
		card.css('position', 'absolute');
		card.css($('#deck').offset());
		$('#deck').append(card);
		card.removeClass('cursor-grab');

		var xx = i/2;
		var yy = xx/2;
		card.transition({ x: '+='+xx+'px', y: '+='+yy+'px' });
	}
}
/*
function sleep(miliseconds) {
   var max_sec = new Date().getTime();
   while (new Date() < max_sec + miliseconds) {}
   return true;
}
*/
function cardDeckInit(){
	cardsDeck = [];
	for (var i=1; i <= 52; i++) cardsDeck.push(i);
	//cardDeckShuffle();		
}

function cardDeckShuffle(){
	shuffle(cardsDeck);
}

function shuffle(array) {
    var tmp, current, top = array.length;
    if(top) while(--top) {
    	current = Math.floor(Math.random() * (top + 1));
    	tmp = array[current];
    	array[current] = array[top];
    	array[top] = tmp;
    }
    return array;
}

function getCardId(card_nr) {
	var color = getCardColor(card_nr);
	var rank  = getCardRank(card_nr);
	return "card_" + color + "_" + rank;
}

function getCardColor(card_nr){
	return Math.floor((card_nr-1)/13)+1;
}

function getCardRank(card_nr){
	return (card_nr-1)%13+1;
}

function makeCards(){
	var card;
	for (var i=0; i < cardsDeck.length; i++) {
		var card_id = getCardId(cardsDeck[i]);
		//var card = $('<div class="card scaled"></div>');
		var card = $('<div class="card scaled"><div class="front"></div><div class="back"></div></div>');
		card.attr('id', card_id);
		//card.children('.front').attr('id', card_id);

		//card.addClass('flipped');
		card.children('.front').hide();
		card.children('.back').show();

		card.data('number', cardsDeck[i]);
		card.data('color',  getCardColor(cardsDeck[i]));
		card.data('rank',   getCardRank( cardsDeck[i]));
		card.data('indeck', true);
		card.css('z-index', 1);
		card.css('position', 'absolute');

		card.css($('#deck').offset());
		$('#deck').append(card);
		
		//move background-image from card to child (front div)
		card.children('.front').css('background-image', card.css('background-image'));
		card.css('background-image', 'none');

		card.css('visibility', 'hidden');
		card.children('.front').css('visibility', 'visible');
		card.children('.back').css('visibility', 'visible');

	}
}

function dealCards(){
	var i = 0;
	for (var c=1; c <= 7; c++) {	// cells
		var new_cell = true;
		var first_card = true;
		for (var r=1; r <= c; r++) { // place reversed cards (0 for the first cell)
			//var card_id = getCardId(cardsDeck[i]);
			//var card = $('#'+card_id);

			var card = $('#deck').find($('div.card')).last();
			card.css('transform', '');
		
			if (new_cell){// place first card of new column in cell's place
				new_cell = false;
				card.css("position", "relative");
				card.css({"left": 0, "top": 0});
				moveAnimate(card, $('#cell'+c));
			}
			else{// place next cards lower than previous
				card.css("position", "relative");
				card.css({"left": 0, "top": Math.floor(offsetY/2)});
				moveAnimate(card, $('#cell'+c).find($('div.card')).last());
			}
			card.data('indeck', false);
			i++;
		}
	}
}

function openLastCards(){
	for (var c=1; c <= 7; c++) {	// cells
		var lastCard = $('#cell'+c).find($('div.card')).last();
		if( (lastCard.length != 0) && (lastCard.hasClass('flipped')) ){
			lastCard.droppable("option", "disabled", false);
			openCard(lastCard);
		}
	}
}

function checkFoundations(){
	var cards = 0;
	for (var f=1; f <= 4; f++) {	// foundations
		cards += $('#fcell'+f).find($('div.card')).length;
	}
	if (cards === 52) {
		$('#GameCompletedModal').modal();
		console.log('You did it!'); //You did it!
	}
}

function openCard(card, callback){
	if (typeof callback === 'function') rotateCard(card, 150, callback);
	else rotateCard(card, 150);
	card.draggable('enable');
	card.removeClass('flipped');
	card.addClass('cursor-grab');
}

function rotateCard(card, duration, callback){
	card.children('.back').transition(
		{ perspective: '300px', rotateY: '-=90', scale: 1.4},
		duration,
		'linear',
		function() {
			card.children('.back').hide();
 			card.children('.front').css('transform','rotateY(90deg)');
 			//card.children('.front').css('transform','scale(1.6, 1.6)');
 			card.children('.front').transition({scale: 1.4}, 0, function() {
	 			card.children('.front').show();
				card.children('.front').transition(
					{ perspective: '300px', rotateY: '-=90', scale: 1.0},
					duration*5,
					'easeOutQuint', function () {
						 typeof callback === 'function' && callback();
					});	
 			});
			
		}
	);
}

function closeCard(card){
	if ($(card).length>0) {
		$(card).addClass('flipped');
		$(card).draggable('disable');
		$(card).droppable("option", "disabled", true);
		card.css('transform','');
		card.children('.front').css('transform','rotateY(0deg)')
		card.children('.back' ).css('transform','rotateY(0deg)')
		card.children('.front').hide();
		card.children('.back').show();
	}
	else return false;
}

function addDeckCardClick(){
	$('.card.flipped').filterByData('indeck', true).click(function(event){ 
		event.stopPropagation();
		if ($(this).parent().attr('id') == 'deck'){ // open top card
			
			var offset = $('#deck-x').offset().left - $('#deck').offset().left;

			$(this).delay(10).transition({x: '+='+offset}, 200, 'linear', function(){
				$(this).css($('#deck-x').offset());
				$(this).css("transform","");
				openCard( $(this), function(){
						});				
			});
	
			var lastZ = parseInt($('#deck-x').find($('div.card')).last().css('z-index'));
			if (isNaN(lastZ)) $(this).css('z-index',1); // first card
			else $(this).css('z-index', lastZ+1);

					$('#deck-x').append($(this));

					//var topCard = $(this).prev();
					//$(this).css({'left': $(this).offset().left + 1, 'top': $(this).offset().top + 1});
					var xx = $('#deck-x').children().length/2;
					var yy = xx/2;
					$(this).transition({ x: '+='+xx+'px', y: '+='+yy+'px' });
		}
	});
}

function addDeckReverse(){
	$('#deck').click(function(){ 
		if (isCellEmpty($('#deck'))){
			var cardsToReverse =  $('#deck-x').children().length;
			var topCard;
			var z = 1;
			// rewrite without 'while' (all z=1 , not ++ anymore)
			while (cardsToReverse) { // is something in deck-x
				topCard = $('#deck-x').find($('div.card')).last();
				//topCard.css('z-index',z);
				topCard.css('z-index',1);
				topCard.css($('#deck').offset());
				topCard.css('transform', '');
				
				//1px offset
				//topCard.css({'left': topCard.offset().left + z/2, 'top':topCard.offset().top + z/2});

				closeCard(topCard);

				$('#deck').append(topCard); // add last card from "deck-x" to "deck"

				var xx = $('#deck').children().length/2;
				var yy = xx/2;
				topCard.transition({ x: '+='+xx+'px', y: '+='+yy+'px' });

				cardsToReverse--;
				z++;
			}
			console.log('cards reversed to deck');
		}
	});	
}

function updateCells(){
	for (var c=1; c <= 7; c++) { // cells
		if (isCellEmpty($('#cell' + c)) ) { // cell is empty
			$('#cell' + c).data('empty', true);
			$('#cell' + c).droppable( "option", "disabled", false);
		}
		else {
			$('#cell' + c).data('empty', false);
			$('#cell' + c).droppable( "option", "disabled", true);
			$('#cell' + c).find($('div.card')).last().droppable( "option", "disabled", false);
		}
	}
}

function makeCardsDraggable(){
	$('.card').draggable({
        containment: $('#maintable'),
        //stack:'.card,.back',
        opacity: 0.85,
        start: function(){
        	//$('.card').addClass('cursor-grabbing');
        	$(this).addClass('moving');
			dropSuccess = false;
			deltaX = $(this).offset().left - mouseX;
			deltaY = $(this).offset().top  - mouseY;
			var divOffset = {left: mouseX + deltaX, top: mouseY + deltaY};
			$('#mouse_div2').offset(divOffset);
			$oldParent = $(this).parent();
			$('#mouse_div2').append($(this));
        },
        drag: function(event, ui){
        	var divOffset = {left: mouseX + deltaX, top: mouseY + deltaY};
        	$(this).css('position', 'static');
        	$('#mouse_div2').offset(divOffset);
        },
        stop: function(event, ui){
        	$(this).removeClass('moving'); 

          	//$('.card').removeClass('cursor-grabbing');
          	if (!dropSuccess) { // Not success! Drag me back to home

          		$(this).css("position", "relative");
				if ($oldParent.hasClass('card'))    $(this).css({"left": 0, "top": Math.floor(offsetY)});
    	      	if ($oldParent.hasClass('flipped')) $(this).css({"left": 0, "top": Math.floor(offsetY/2)});
        	  	if ($oldParent.hasClass('cells'))   $(this).css({"left": 0, "top": 0});
/*        	  	if ($oldParent.hasClass('foundation-cells')) {
        	  		$(this).css("position", "absolute");
        	  		$(this).css($oldParent.offset());
        	  	}
*/				moveAnimate($(this), $oldParent);	
				
				$('#mouse_div2').offset($('body').offset());
          	}
        }
    });

    $('.flipped').draggable('disable');
}

function makeCardsDropable(){    
   	$('.card').droppable({
    	tolerance: "intersect",
        drop: cardOnCardDropEvent,
    });

	$('.flipped').droppable( "option", "disabled", true);    
}

function makeFoundations(){
	$('.foundation-cells').data('empty', true);

    $('.foundation-cells').droppable({
    	tolerance: "intersect",
    	//hoverClass: $(this).addClass('lightUp'),
    	over: function (event, ui) {if (ui.draggable.data('rank') == 1) $(this).addClass('lightUp');},
    	out:  function (event, ui) {if (ui.draggable.data('rank') == 1) $(this).removeClass('lightUp');},
        drop: handleFoundationDropEvent
    });
}

function makeCells(){
	$('.cells').not('.dialing-cells').data('empty', true);

    $('.cells').not('.foundation-cells,.dealing-cells').droppable({
    	tolerance: "intersect",    	
        drop: handleCellDropEvent
    });
}

function handleFoundationDropEvent( event, ui ) {
		var lastCard = $(this).find($('div.card')).last();
	if( ((ui.draggable.data('rank') == 1) && isCellEmpty($(this)) )  // ace on empty
		||( // or not first on not empty
			   (doRanksMatchF(lastCard, ui.draggable)) 
			&& (doColorsMatchF(lastCard, ui.draggable))	) ){

		ui.draggable.css('transform', '');
		$(this).data('empty', false);
		
		$(this).append(ui.draggable);
		var topCardZ = parseInt($(this).find($('div.card')).last().css('z-index'));
		if (isNaN(topCardZ)) topCardZ = 1; 
		else topCardZ++;
		ui.draggable.css('z-index', topCardZ);
		//console.log('topCardZ = ' + topCardZ);
		
		ui.draggable.data('indeck', false);		
		ui.draggable.unbind('click');
		
		ui.draggable.css("position", "absolute");
		var parentX = $(this).offset().left;
		var parentY = $(this).offset().top;
		ui.draggable.css($(this).offset());

		ui.draggable.droppable("option", "greedy", false);
		ui.draggable.droppable("option", "disabled", true);

		$(this).droppable("option", "greedy", true);
		$(this).droppable("option", "disabled", false);		
		
		dropSuccess = true;

		if (ui.draggable.data('rank') != 1){
			var xx = $(this).children().length/2;
			var yy = xx/2;
			ui.draggable.transition({ x: '+='+xx+'px', y: '+='+yy+'px' });
		}
		updateAll();
	}
}

function cardOnCardDropEvent( event, ui ) {
//	if ( doColorsMatch($(this), ui.draggable) && doRanksMatch($(this), ui.draggable)) {
	if(true){
		ui.draggable.css('transform', '');
		ui.draggable.css('position', 'relative');
		ui.draggable.css({"left": 0, "top": offsetY});
		
		$(this).append(ui.draggable);
		
		ui.draggable.data('indeck', false);
		ui.draggable.droppable( "option", "greedy", true);
		
		$(this).droppable("option", "greedy", false);		
		$(this).droppable("option", "disabled", true);
		
		dropSuccess = true;		

		updateAll();
	}
}

function handleCellDropEvent( event, ui ) {
		ui.draggable.css('transform', '');
		ui.draggable.css('position', 'relative');
		ui.draggable.css({"left": 0, "top": 0});

		$(this).append(ui.draggable);

		ui.draggable.data('indeck', false);	
		ui.draggable.droppable( "option", "greedy", true);
		
		$(this).droppable("option", "greedy", false);
		
		dropSuccess = true;
		
		updateAll();
}


function isCellEmpty(cell){
	if (cell.attr('id') == 'deck') {
	  if (cell.children().length == 1) return true;
	}
	else if (cell.children().length == 0) return true;
	else return false;
}

function doColorsMatch(card1, card2){
	if ( ((card1.data('color') == 1)||(card1.data('color') == 2))  && ((card2.data('color') == 3)||(card2.data('color') == 4)) ) return true;
	else if ( ((card1.data('color') == 3)||(card1.data('color') == 4))  && ((card2.data('color') == 1)||(card2.data('color') == 2)) ) return true;
	else return false;
}

function doRanksMatch(card1, card2){ // card2 - card on top
	if ( (card1.data('rank') - card2.data('rank')) === 1 ) return true;
	else return false;
}

function doColorsMatchF(card1, card2){ // for final stack (foundation)
	if ( card1.data('color') == card2.data('color') ) return true;
	else return false;
}

function doRanksMatchF(card1, card2){ // card2 - card on top
									 // for final stack (foundation)
	if ( (card2.data('rank') - card1.data('rank')) === 1 ) return true;
	else return false;
}

 
function moveAnimate(element, newParent, callback){
    //Allow passing in either a jQuery object or selector

    element = $(element);
    newParent= $(newParent);

    var oldOffset = element.offset();
    
    element.appendTo(newParent);
    var newOffset = element.offset();

    var temp = element.clone().appendTo('body');
    element.hide();    
    temp.css({
        'position': 'absolute',
        'left': oldOffset.left,
        'top': oldOffset.top,
        'z-index': 1000
    });
    //temp.animate({'top': newOffset.top, 'left': newOffset.left}, 'slow', function(){
    if (element.parent().attr('id') == 'deck-x'){
    	temp.velocity($('#deck-x').offset(), 200, function(){
       		temp.remove();
       		element.css("position", "absolute");
       		element.css($('#deck-x').offset());
       		element.show();
       		typeof callback === 'function' && callback();
       		console.log('moved');
    });
	}
	else
	temp.velocity({'top': newOffset.top, 'left': newOffset.left}, 200, function(){
       element.show();
       temp.remove();
       typeof calbBack === 'function' && callback();
    });

	
}

function footerAnimation(){

	$('.footer-logos').not('#logo1').css('opacity', 0);
	$("#footer-copy").hover( 
    function (){
        $.fx.speeds._default = 500;
        $('#footer-copy').stop();
        $('#footer-copy').transition({x: '-=280'});
        $.fx.speeds._default = 200;
        for (var c=2; c <= 7; c++) {
            $logo = $('#logo' + c);
            $logo.stop();            
            $logo.css('left', - c*50);
            var ofst = '+=' + (c*50);
            $logo.transition({opacity: 1, x: ofst , delay: c*50});
        }
    },
    function (){
        $.fx.speeds._default = 200;
        $('#footer-copy').stop();
        for (var c=2; c <= 7; c++) {
            $logo = $('#logo' + c);
            $logo.stop();            
            var ofst = '-=' + (c*50);
            $logo.transition({opacity: 0, x: ofst, delay: c*100-100});
        }
        $.fx.speeds._default = 800;
        $('#footer-copy').transition({x: '+=280', delay: 500});
        $.fx.speeds._default = 300;
    }
    ); // on hover
}

// recalculete absolute positions after web-page zoom change
$(window).resize(function() {
	//zoomToFit();
	recalculateAbsolutes ();	
});

function zoomToFit(){
	/*
	var windowH = $(window).height();
	var scale = windowH/946;
	if (scale > 1) scale = 1;
	if ($.browser.chrome){
		currIEZoom = scale*100;
		$('body').css('zoom', ' ' + currIEZoom + '%');
	}
	*/
}

function recalculateAbsolutes () {
/*
	$('.card').filterByData('indeck', true).each(function (index, value) {
		 $(this).css($(this).parent().offset());
	})

	$('.foundation-cells').children().each(function (index, value) {
		 $(this).css($(this).parent().offset());
	})
	*/
}

// select elements by .data property
(function ($) {

    $.fn.filterByData = function (prop, val) {
        var $self = this;
        if (typeof val === 'undefined') {
            return $self.filter(
                function () { return typeof $(this).data(prop) !== 'undefined'; }
            );
        }
        return $self.filter(
            function () { return $(this).data(prop) == val; }
        );
    };

})(window.jQuery);

//console.clear();
//console.log("--------------------------------");
//console.log("Solitaire (C) Ignas Gramba 2016 ");
//console.log("--------------------------------");