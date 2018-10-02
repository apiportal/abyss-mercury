define(['config', 'Vue', 'axios', 'vee-validate'], function (abyss, Vue, axios, VeeValidate) {
	Vue.use(VeeValidate)
	// import { Validator } from 'vee-validate';
	const dictionary = {
		en: {
			attributes: {
				username: 'Username',
				firstname: 'First Name',
				lastname: 'Last Name',
				isAgreedToTerms: 'I agree to all Terms',
				email: 'Email',
				newPassword: 'Password',
				password2: 'Confirm Password',
				confirmPassword: 'Confirm Password',
				password: 'Password'
			}
		}
	};
	VeeValidate.Validator.localize(dictionary);
	VeeValidate.Validator.extend('password_strength', {
		getMessage: field => 'The password must contain at least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (*,._&?)',
		validate: value => {
			var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
			return strongRegex.test(value);
		}
	});
	new Vue({
		el: '#portal',
		data: {
			remember: false,
			terms: false,
			abyssVersion: abyss.abyssVersion,
			end: []
		},
		methods: {
			validateBeforeSubmit(event) {
				event.preventDefault();
				this.$validator.validateAll().then((result) => {
					if (result) {
						document.querySelector('#validForm').submit();
						return;
					}
				});
			},
			preload() {
				$('.preloader-it > .la-anim-1').addClass('la-animate');
				$(document).ready(function() {
					$(".preloader-it").fadeOut("slow");
				});
			},
		},
		mounted() {
			this.preload();
		},
		created() {
			console.log("JS: auth.js: ", this.abyssVersion);
		}
	});
});
