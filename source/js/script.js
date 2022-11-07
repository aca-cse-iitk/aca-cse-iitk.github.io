import { WOW } from "wowjs";
import 'smoothscroll-for-websites';
// import "slick-carousel";
// import $ from "jquery";
const wow = new WOW({
	scrollContainer:'.content-main',
});
wow.init();

(function ($) {
	'use strict';
	
	// Preloader js    
	$(window).on('load', function () {
		$('.preloader').fadeOut(700);
	});
	
	// Sticky Menu
	// $(window).scroll(function () {
	// 	var height = $('.top-header').innerHeight();
	// 	if ($('header').offset().top > 10) {
	// 		$('.top-header').addClass('hide');
	// 		$('.navigation').addClass('nav-bg');
	// 		$('.navigation').css('margin-top', '-' + height + 'px');
	// 	} else {
	// 		$('.top-header').removeClass('hide');
	// 		$('.navigation').removeClass('nav-bg');
	// 		$('.navigation').css('margin-top', '-' + 0 + 'px');
	// 	}
	// });
	// navbarDropdown
	if ($(window).width() < 992) {
		$('.navigation .dropdown-toggle').on('click', function () {
			$(this).siblings('.dropdown-menu').animate({
				height: 'toggle'
			}, 300);
		});
	}
	
	// Background-images
	$('[data-background]').each(function () {
		$(this).css({
			'background-image': 'url(' + $(this).data('background') + ')'
		});
	});
	
	//Hero Slider
	// $('.hero-slider').slick({
	// 	autoplay: true,
	// 	autoplaySpeed: 7500,
	// 	pauseOnFocus: false,
	// 	pauseOnHover: false,
	// 	infinite: true,
	// 	arrows: true,
	// 	fade: true,
	// 	prevArrow: '<button type=\'button\' class=\'prevArrow\'><i class=\'ti-angle-left\'></i></button>',
	// 	nextArrow: '<button type=\'button\' class=\'nextArrow\'><i class=\'ti-angle-right\'></i></button>',
	// 	dots: true
	// });
	// $('.hero-slider').slickAnimation();
	
	// venobox popup
	$(document).ready(function () {
		$('.venobox').venobox();
		
		
	});
	
	
	// filter
	// $(document).ready(function () {
	// 	var containerEl = document.querySelector('.filtr-container');
	// 	var filterizd;
	// 	if (containerEl) {
	// 		filterizd = $('.filtr-container').filterizr({});
	// 	}
	// 	//Active changer
	// 	$('.filter-controls li').on('click', function () {
	// 		$('.filter-controls li').removeClass('active');
	// 		$(this).addClass('active');
	// 	});
	// });
	
	//  Count Up
	// function counter() {
	// 	var oTop;
	// 	if ($('.count').length !== 0) {
	// 		oTop = $('.count').offset().top - window.innerHeight;
	// 	}
	// 	if ($(window).scrollTop() > oTop) {
	// 		$('.count').each(function () {
	// 			var $this = $(this),
	// 			countTo = $this.attr('data-count');
	// 			$({
	// 				countNum: $this.text()
	// 			}).animate({
	// 				countNum: countTo
	// 			}, {
	// 				duration: 1000,
	// 				easing: 'swing',
	// 				step: function () {
	// 					$this.text(Math.floor(this.countNum));
	// 				},
	// 				complete: function () {
	// 					$this.text(this.countNum);
	// 				}
	// 			});
	// 		});
	// 	}
	// }
	// $(window).on('scroll', function () {
	// 	counter();
	// });
	
	
})(jQuery);




// var scrollToElement = require('scroll-to-element');
// const idDic ={
// 	"toHome" : "#home",
// 	"toAbout" : "#about",
// 	"toEvents":"#events",
// 	"toBestFac":"#best-fac",
// 	"toProjects":"#projects",
// 	"toContacts":"#contacts"
// }
// $(document).ready(function(){
//     $(".scroll-ani").click(function(){
// 		scrollToElement(idDic[$(this).attr("id")],{offset: -100});

//     });
// });
// var SmoothScroll=require('smooth-scroll')
// var scroll = new SmoothScroll('a[href*="#"]',{offset:100,speed:10});

// var anime=require('animejs');
// var litm=document.querySelectorAll("#events-list li");
// var animation = anime({
// 	targets: litm,
// 	keyframes : [
// 		{opacity: 0,translateX : -10,duration:0},
// 		{opacity: 100,translateX : 10}
// 	],
// 	delay: anime.stagger(100, {start: 0}),
// 	autoplay:false,
//   });
// $(window).scroll(function() {
// 	var hT = $('#events-list').offset().top,
//        hH = $('#events-list').outerHeight(),
//        wH = $(window).height(),
//        wS = $(this).scrollTop();
//    if (wS > (hT+hH-wH) && (hT > wS) && (wS+wH > hT+hH)){
//        animation.restart();
//    }
//  });
jQuery(function(){
	$.get( "data/facultyaward.csv", function( data ) {
		var content=$(".awardtime")[0].innerHTML;
		var to=$(".awardtime");
		to[0].innerHTML="";
		data.split("\n").forEach(function(row) {
			var ele=$(content);
			
			var arr=row.split(",");
			ele.children("div").children(".content").children("p").text(arr[0]);
			ele.children("div").children(".content-hover").children("p").text(arr[1]);
			ele.children("div").children(".content-hover").children("h1").text(arr[0]);
			to.append(ele);
		});
		// wow.sync();
		var sli=$(".awardtime").slick({
			slidesToShow: 3,
			centerMode: true,
	//   centerPadding: '360px',
			slidesToScroll: 1,
			autoplay: true,
			pauseOnFocus:false,
			autoplaySpeed: 2000,
			
			// fade:true,
			// swipeToSlide:true,
			arrows:false,
			cssEase: 'linear',
			// infinite:false,
			responsive : [
				{
					breakpoint: 600,
					settings: {
						slidesToShow: 1,
						
					},
				}
			],
		});
		sli.on('beforeChange', function(event, slick, currentSlideIndex, nextSlideIndex) {
		// 	if(nextSlideIndex > currentSlideIndex) {
		// 		// Animation to go to next slide
		// 		nextSlideIndex+=1;
		// 	   $('.awardtime .slick-slide[data-slick-index=' + (currentSlideIndex-1) + ']').addClass('bounceOutDown').removeClass('bounceInDown');
		// 	   $('.awardtime .slick-slide[data-slick-index=' + nextSlideIndex + ']').addClass('bounceInDown').removeClass('bounceOutDown');
		//    } else {
		//    }
	   });
	});
	$.get("data/eventslist.csv",function(data){
		var content="";
		data.split("\n").forEach(function(row){
			content+="<li class='wow fadeInLeft'>";
			content+="<p>"+row.split('`')[0]+"</p>";
			content+="</li>"
		});
		$("#events-list")[0].innerHTML=content;
		wow.sync();
	});
	$(".projectsslide").slick({
		slidesToShow: 3,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 2000,
		// centerMode:true,
		dots:false,
		arrows:true,
		nextArrow:$('.nxtproj'),
		prevArrow:$('.prevproj'),
		responsive : [
			{
				breakpoint: 600,
				settings: {
					slidesToShow: 1,
					
				},
			}
		],
	});
	
	
});

// var lastScrollTop = $(this).scrollTop();

// 	$(window).scroll(function(){
// 		var st = $(this).scrollTop();
		
// 		if (st > lastScrollTop){
// 			$('html, body').animate({
// 				scrollTop: st+10,
// 			},80);
// 		} else {
// 			$('html, body').animate({
// 				scrollTop: st-10,
// 			},80);
// 		}
// 		lastScrollTop = st;
// 	});