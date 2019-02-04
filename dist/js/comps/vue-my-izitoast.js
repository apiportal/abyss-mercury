const MyToaster = {
	install: function(Vue, options) {
		// 1. add global method or property
		Vue.myGlobalMethod = function() {
			// something logic ...
		}
		// 2. add a global asset
		Vue.directive('my-directive', {
			bind(el, binding, vnode, oldVnode) {
				// something logic ...
			}
		});
		// 3. inject some component options
		Vue.mixin({
			data() {
				return {
					answer: null,
					toastOptions: {
						defs: {
							// id: null, 
							// class: '',
							// title: '',
							// titleColor: '',
							// titleSize: '',
							// titleLineHeight: '',
							// message: '',
							// messageColor: '',
							// messageSize: '',
							// messageLineHeight: '',
							// backgroundColor: '',
								theme: 'dark', // light
							// color: '', // blue, red, green, yellow
							// icon: 'fas',
							// iconText: '',
							// iconColor: '',
							// iconUrl: null,
							// image: '',
							// imageWidth: 50,
							// maxWidth: null,
							// zindex: null,
								layout: 2,
							// balloon: false,
							// close: true,
							// closeOnEscape: false,
								closeOnClick: true,
							displayMode: 0,
								position: 'topRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
							// target: '',
							// targetFirst: true,
							// timeout: 5000,
							// rtl: false,
							// animateInside: true,
							// drag: true,
							// pauseOnHover: true,
							// resetOnHover: false,
							// progressBar: true,
							// progressBarColor: '',
							// progressBarEasing: 'linear',
							// overlay: false,
							// overlayClose: false,
							// overlayColor: 'rgba(0, 0, 0, 0.6)',
							// transitionIn: 'fadeInUp', // bounceInLeft, bounceInRight, bounceInUp, bounceInDown, fadeIn, fadeInDown, fadeInUp, fadeInLeft, fadeInRight, flipInX
							// transitionOut: 'fadeOut', // fadeOut, fadeOutUp, fadeOutDown, fadeOutLeft, fadeOutRight, flipOutX
							// transitionInMobile: 'fadeInUp',
							// transitionOutMobile: 'fadeOutDown',
							// buttons: {},
							// inputs: {},
							// onOpening: function () {},
							// onOpened: function () {},
							// onClosing: function () {},
							// onClosed: function () {}
						},
						question: {
							timeout: 20000000,
							color: 'yellow',
							close: false,
							overlay: true,
							toastOnce: true,
							id: "question",
							zindex: 999,
							position: "center",
							buttons: [
								[
									"<button><b>YES</b></button>",
									function(instance, toast) {
										this.answer = true;
										// console.log("this.answer: ", this.answer);
										instance.hide({ transitionOut: "fadeOut" }, toast, "button");
										// return this.answer;
									},
									true
								],
								[
									"<button>NO</button>",
									function(instance, toast) {
										this.answer = false;
										// console.log("this.answer: ", this.answer);
										instance.hide({ transitionOut: "fadeOut" }, toast, "button");
										// return this.answer;
									}
								]
							],
							onClosing: function(instance, toast, closedBy) {
								// console.info("Closing | closedBy: " + closedBy);
							},
							onClosed: function(instance, toast, closedBy) {
								// console.info("Closed | closedBy: " + closedBy);
							}
						},
						error: {
							color: 'red',
						},
						success: {
							color: 'green',
						},
						info: {
							color: 'blue',
						},
						warning: {
							color: 'orange',
						}
					}
				}
			},
			created() {
				
			},
			methods: {
				toast(type, ops) {
					var errorDefs = this.toastOptions.error;
					var successDefs = this.toastOptions.success;
					var infoDefs = this.toastOptions.info;
					var warningDefs = this.toastOptions.warning;
					var questionDefs = this.toastOptions.question;
					require(['izitoast'],function(iziToast){
						if (type == 'show') {
							iziToast.show(ops);
						} else if (type == 'error') {
							var errorConfig = Object.assign(errorDefs, ops);
							iziToast.error(errorConfig);
						} else if (type == 'success') {
							var successConfig = Object.assign(successDefs, ops);
							iziToast.success(successConfig);
						} else if (type == 'info') {
							var infoConfig = Object.assign(infoDefs, ops);
							iziToast.info(infoConfig);
						} else if (type == 'warning') {
							var warningConfig = Object.assign(warningDefs, ops);
							iziToast.warning(warningConfig);
						} else if (type == 'question') {
							var questionConfig = Object.assign(questionDefs, ops);
							iziToast.question(questionConfig);
						} else if (type == 'hide') {
							var selectedToast = document.querySelector('.iziToast'); // Selector of your toast
							iziToast.hide(selectedToast);
							iziToast.hide();
						}
					});
				},
			}
		})
		// 4. add an instance method
		Vue.prototype.$toast = function(type, methodOptions) {
			var defs = this.toastOptions.defs;
			require(['izitoast'],function(iziToast){
				iziToast.settings(defs);
			});
			// var encoded = encodeURI(methodOptions);
			methodOptions.title = _.escape(methodOptions.title);
			methodOptions.message = _.escape(methodOptions.message);
			this.toast(type, methodOptions);
		}
	}
}
