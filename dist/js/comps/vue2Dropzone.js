! function(e, o) {
	"object" == typeof exports && "undefined" != typeof module ? module.exports = o() : "function" == typeof define && define.amd ? define(o) : e.vue2Dropzone = o()
}(this, function() {
	"use strict";
	var e = {
		getSignedURL(file, config) {
			let payload = {
				filePath: file.name,
				contentType: file.type
			}

			return new Promise((resolve, reject) => {
				var fd = new FormData();
				let request = new XMLHttpRequest(),
						signingURL = (typeof config.signingURL === "function") ?  config.signingURL(file) : config.signingURL;
				request.open("POST", signingURL);
				request.onload = function () {
					if (request.status == 200) {
						resolve(JSON.parse(request.response));
					} else {
						reject((request.statusText));
					}
				};
				request.onerror = function (err) {
					console.error("Network Error : Could not send request to AWS (Maybe CORS errors)");
					reject(err)
				};
				Object.entries(config.headers || {}).forEach(([name, value]) => {
					request.setRequestHeader(name, value);
				});
				payload = Object.assign(payload, config.params || {});
				Object.entries(payload).forEach(([name, value]) => {
					fd.append(name, value);
				});

				request.send(fd);
			});
		},
		sendFile(file, config, is_sending_s3) {
			var handler = (is_sending_s3) ? this.setResponseHandler : this.sendS3Handler;

			return this.getSignedURL(file, config)
				.then((response) => {return handler(response, file)})
				.catch((error) => { return error; });
		},
		setResponseHandler(response, file) {
			file.s3Signature = response.signature;
			file.s3Url = response.postEndpoint;
		},
		sendS3Handler(response, file) {
			let fd = new FormData(),
				signature = response.signature;

			Object.keys(signature).forEach(function (key) {
				fd.append(key, signature[key]);
			});
			fd.append('file', file);
			return new Promise((resolve, reject) => {
				let request = new XMLHttpRequest();
				request.open('POST', response.postEndpoint);
				request.onload = function () {
					if (request.status == 201) {
						var s3Error = (new window.DOMParser()).parseFromString(request.response, "text/xml");
						var successMsg = s3Error.firstChild.children[0].innerHTML;
						resolve({
							'success': true,
							'message': successMsg
						})
					} else {
						var s3Error = (new window.DOMParser()).parseFromString(request.response, "text/xml");
						var errMsg = s3Error.firstChild.children[0].innerHTML;
						reject({
							'success': false,
							'message': errMsg + ". Request is marked as resolved when returns as status 201"
						})
					}
				};
				request.onerror = function (err) {
					var s3Error = (new window.DOMParser()).parseFromString(request.response, "text/xml");
					var errMsg = s3Error.firstChild.children[1].innerHTML;
					reject({
						'success': false,
						'message': errMsg
					})
				};
				request.send(fd);
			});
		}
	};
	return {
		render: function() {
			var e = this.$createElement;
			return(this._self._c || e)("div", {
				ref: "dropzoneElement",
				class: {
					"vue-dropzone dropzone": this.includeStyling
				},
				attrs: {
					id: this.id
				}
			})
		},
		staticRenderFns: [],
		props: {
			id: {
				type: String,
				required: true
			},
			options: {
				type: Object,
				required: true
			},
			includeStyling: {
				type: Boolean,
				default: true,
				required: false
			},
			awss3: {
				type: Object,
				required: false,
				default: null
			},
			destroyDropzone: {
				type: Boolean,
				default: true,
				required: false
			}
		},
		data() {
			return {
				isS3: false,
				isS3OverridesServerPropagation: false,
				wasQueueAutoProcess: true,
			}
		},
		computed: {
			dropzoneSettings() {
				let defaultValues = {
					thumbnailWidth: 200,
					thumbnailHeight: 200
				}
				Object.keys(this.options).forEach(function(key) {
					defaultValues[key] = this.options[key]
				}, this)
				if (this.awss3 !== null) {
					defaultValues['autoProcessQueue'] = false;
					this.isS3 = true;
					this.isS3OverridesServerPropagation = (this.awss3.sendFileToServer === false);
					if (this.options.autoProcessQueue !== undefined)
						this.wasQueueAutoProcess = this.options.autoProcessQueue;

					if (this.isS3OverridesServerPropagation) {
						defaultValues['url'] = (files) => {
							return files[0].s3Url;
						}
					}
				}
				return defaultValues
			}
		},
		methods: {
			manuallyAddFile: function(file, fileUrl) {
				file.manuallyAdded = true;
				this.dropzone.emit("addedfile", file);
				fileUrl && this.dropzone.emit("thumbnail", file, fileUrl);

				var thumbnails = file.previewElement.querySelectorAll('[data-dz-thumbnail]');
				for (var i = 0; i < thumbnails.length; i++) {
					thumbnails[i].style.width = this.dropzoneSettings.thumbnailWidth + 'px';
					thumbnails[i].style.height = this.dropzoneSettings.thumbnailHeight + 'px';
					thumbnails[i].style['object-fit'] = 'contain';
				}
				this.dropzone.emit("complete", file)
				if (this.dropzone.options.maxFiles) this.dropzone.options.maxFiles--
				this.dropzone.files.push(file)
				this.$emit('vdropzone-file-added-manually', file)
			},
			setOption: function(option, value) {
				this.dropzone.options[option] = value
			},
			removeAllFiles: function(bool) {
				this.dropzone.removeAllFiles(bool)
			},
			processQueue: function() {
				let dropzoneEle = this.dropzone;
				if (this.isS3 && !this.wasQueueAutoProcess) {
					this.getQueuedFiles().forEach((file) => {
						this.getSignedAndUploadToS3(file);
					});
				} else {
					this.dropzone.processQueue();
				}
				this.dropzone.on("success", function() {
					dropzoneEle.options.autoProcessQueue = true
				});
				this.dropzone.on('queuecomplete', function() {
					dropzoneEle.options.autoProcessQueue = false
				})
			},
			init: function() {
				return this.dropzone.init();
			},
			destroy: function() {
				return this.dropzone.destroy();
			},
			updateTotalUploadProgress: function() {
				return this.dropzone.updateTotalUploadProgress();
			},
			getFallbackForm: function() {
				return this.dropzone.getFallbackForm();
			},
			getExistingFallback: function() {
				return this.dropzone.getExistingFallback();
			},
			setupEventListeners: function() {
				return this.dropzone.setupEventListeners();
			},
			removeEventListeners: function() {
				return this.dropzone.removeEventListeners();
			},
			disable: function() {
				return this.dropzone.disable();
			},
			enable: function() {
				return this.dropzone.enable();
			},
			filesize: function(size) {
				return this.dropzone.filesize(size);
			},
			accept: function(file, done) {
				return this.dropzone.accept(file, done);
			},
			addFile: function(file) {
				return this.dropzone.addFile(file);
			},
			removeFile: function(file) {
				this.dropzone.removeFile(file)
			},
			getAcceptedFiles: function() {
				return this.dropzone.getAcceptedFiles()
			},
			getRejectedFiles: function() {
				return this.dropzone.getRejectedFiles()
			},
			getFilesWithStatus: function() {
				return this.dropzone.getFilesWithStatus()
			},
			getQueuedFiles: function() {
				return this.dropzone.getQueuedFiles()
			},
			getUploadingFiles: function() {
				return this.dropzone.getUploadingFiles()
			},
			getAddedFiles: function() {
				return this.dropzone.getAddedFiles()
			},
			getActiveFiles: function() {
				return this.dropzone.getActiveFiles()
			},
			getSignedAndUploadToS3(file) {
				var promise = awsEndpoint.sendFile(file, this.awss3, this.isS3OverridesServerPropagation);
					if (!this.isS3OverridesServerPropagation) {
						promise.then((response) => {
							if (response.success) {
								file.s3ObjectLocation = response.message
								setTimeout(() => this.dropzone.processFile(file))
								this.$emit('vdropzone-s3-upload-success', response.message);
							} else {
								if ('undefined' !== typeof message) {
									this.$emit('vdropzone-s3-upload-error', response.message);
								} else {
									this.$emit('vdropzone-s3-upload-error', "Network Error : Could not send request to AWS. (Maybe CORS error)");
								}
							}
						});
					} else {
						promise.then(() => {
						setTimeout(() => this.dropzone.processFile(file))
					});
				}
				promise.catch((error) => {
					alert(error);
				});
			},
			setAWSSigningURL(location) {
				if (this.isS3) {
					this.awss3.signingURL = location;
				}
			}
		},
		mounted() {
			if (this.$isServer && this.hasBeenMounted) {
				return
			}
			this.hasBeenMounted = true
			// let Dropzone = require('dropzone') //eslint-disable-line
			Dropzone.autoDiscover = false
			this.dropzone = new Dropzone(this.$refs.dropzoneElement, this.dropzoneSettings)
			let vm = this

			this.dropzone.on('thumbnail', function(file, dataUrl) {
				vm.$emit('vdropzone-thumbnail', file, dataUrl)
			})

			this.dropzone.on('addedfile', function(file) {
				if (vm.duplicateCheck) {
					if (this.files.length) {
						this.files.forEach(function(dzfile) {
							if (dzfile.name === file.name) {
								this.removeFile(file)
								vm.$emit('duplicate-file', file)
							}
						}, this)
					}
				}
				// !! My
				if (vm.dropzone.options.maxFiles == 1) {
					if (this.files.length > 1) {
						this.files.forEach(function(dzfile) {
							this.removeFile(file)
						}, this)
					}
				}
				vm.$emit('vdropzone-file-added', file)
				if (vm.isS3 && vm.wasQueueAutoProcess) {
					vm.getSignedAndUploadToS3(file);
				}
			})

			this.dropzone.on('addedfiles', function(files) {
				vm.$emit('vdropzone-files-added', files)
			})

			this.dropzone.on('removedfile', function(file) {
				vm.$emit('vdropzone-removed-file', file)
				if (file.manuallyAdded) vm.dropzone.options.maxFiles++
			})

			this.dropzone.on('success', function(file, response) {
				vm.$emit('vdropzone-success', file, response)
				if (vm.isS3) {
						vm.$emit('vdropzone-s3-upload-success');
						if (vm.wasQueueAutoProcess)
							vm.setOption('autoProcessQueue', false);
				}
			})

			this.dropzone.on('successmultiple', function(file, response) {
				vm.$emit('vdropzone-success-multiple', file, response)
			})

			this.dropzone.on('error', function(file, message, xhr) {
				vm.$emit('vdropzone-error', file, message, xhr)
				if (this.isS3)
					vm.$emit('vdropzone-s3-upload-error');
			})

			this.dropzone.on('errormultiple', function(files, message, xhr) {
				vm.$emit('vdropzone-error-multiple', files, message, xhr)
			})

			this.dropzone.on('sending', function(file, xhr, formData) {
				if (vm.isS3) {
					if (vm.isS3OverridesServerPropagation) {
						let signature = file.s3Signature;
						Object.keys(signature).forEach(function (key) {
							formData.append(key, signature[key]);
						});
					}
				} else {
					formData.append('s3ObjectLocation', file.s3ObjectLocation);
				}
				vm.$emit('vdropzone-sending', file, xhr, formData)
			})

			this.dropzone.on('sendingmultiple', function(file, xhr, formData) {
				vm.$emit('vdropzone-sending-multiple', file, xhr, formData)
			})

			this.dropzone.on('complete', function(file) {
				vm.$emit('vdropzone-complete', file)
			})

			this.dropzone.on('completemultiple', function(files) {
				vm.$emit('vdropzone-complete-multiple', files)
			})

			this.dropzone.on('canceled', function(file) {
				vm.$emit('vdropzone-canceled', file)
			})

			this.dropzone.on('canceledmultiple', function(files) {
				vm.$emit('vdropzone-canceled-multiple', files)
			})

			this.dropzone.on('maxfilesreached', function(files) {
				vm.$emit('vdropzone-max-files-reached', files)
			})

			this.dropzone.on('maxfilesexceeded', function(file) {
				vm.$emit('vdropzone-max-files-exceeded', file)
			})

			this.dropzone.on('processing', function(file) {
				vm.$emit('vdropzone-processing', file)
			})

			this.dropzone.on('processing', function(file) {
				vm.$emit('vdropzone-processing', file)
			})

			this.dropzone.on('processingmultiple', function(files) {
				vm.$emit('vdropzone-processing-multiple', files)
			})

			this.dropzone.on('uploadprogress', function(file, progress, bytesSent) {
				vm.$emit('vdropzone-upload-progress', file, progress, bytesSent)
			})

			this.dropzone.on('totaluploadprogress', function(totaluploadprogress, totalBytes, totalBytesSent) {
				vm.$emit('vdropzone-total-upload-progress', totaluploadprogress, totalBytes, totalBytesSent)
			})

			this.dropzone.on('reset', function() {
				vm.$emit('vdropzone-reset')
			})

			this.dropzone.on('queuecomplete', function() {
				vm.$emit('vdropzone-queue-complete')
			})

			this.dropzone.on('drop', function(event) {
				vm.$emit('vdropzone-drop', event)
			})

			this.dropzone.on('dragstart', function(event) {
				vm.$emit('vdropzone-drag-start', event)
			})

			this.dropzone.on('dragend', function(event) {
				vm.$emit('vdropzone-drag-end', event)
			})

			this.dropzone.on('dragenter', function(event) {
				vm.$emit('vdropzone-drag-enter', event)
			})

			this.dropzone.on('dragover', function(event) {
				vm.$emit('vdropzone-drag-over', event)
			})

			this.dropzone.on('dragleave', function(event) {
				vm.$emit('vdropzone-drag-leave', event)
			})

			vm.$emit('vdropzone-mounted')
		},
		beforeDestroy() {
			if (this.destroyDropzone) this.dropzone.destroy()
		}
	}
});
