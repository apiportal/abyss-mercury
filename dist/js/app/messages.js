define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment', 'vue-select'], function(abyss, Vue, axios, VeeValidate, _, moment, VueSelect) {
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('message-tree', {
		template:'#message-tree',
		props: ['message'],
		data() {
			return {
				isLoading: true,
			};
		},
		methods : {},
		created() {
			
		},
	});
	Vue.component('my-messages', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'created',
					type: Date,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				selected: null,
				folders: {
					inbox: true,
					sent: false,
					important: false,
					drafts: false,
				},
				message: {
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"messagetypeid": null,
					"parentmessageid": null,
					"sendersubjectid": null,
					"receiversubjectid": null,
					"subject": null,
					"body": null,
					"priority": "Important",
					"isstarred": false,
					"isread": false,
					"sentat": "2018-07-20T20:09:42Z",
					"readat": null,
					messageType: null,
					recipients: null,
				},
				parentMessage: null,
				viewMessage: null,
				selectedMessage: {},
				newMessage: {},
				messageList: [],
				messageTypes: [],
				filterTxt: '',
				messageOptions: [],
				searchMessages: '',
				filt: {
					fkey: 'folder',
					fval: 'Inbox'
				},
				fff: '',
				end: []
			};
		},
		computed: {
			stringifyMessage : {
				get() {
					return JSON.stringify(this.message, null, '\t');
				}
			},
			stringifyParentMessage : {
				get() {
					return JSON.stringify(this.parentMessage, null, '\t');
				}
			},
			stringifyViewMessage : {
				get() {
					return JSON.stringify(this.viewMessage, null, '\t');
				}
			},
			filteredMessages() {
				var messageList = this.messageList;
				// console.log("messageList: ", messageList);
				if (this.searchMessages) {
					messageList = messageList.filter(item => item.Name.toLowerCase().includes(this.searchMessages));
				}
				// console.log("this.filt.fval: ", this.filt.fval);
				// console.log("this.filt.fkey: ", this.filt.fkey);
				if (this.filt.fval == 'Sent') {
					messageList = messageList.filter((item) => item.children || (item[this.filt.fkey] == this.filt.fval));
				} else {
					messageList = messageList.filter((item) => item[this.filt.fkey] == this.filt.fval);
				}
				// if (this.searchMessages) {
				// 	messageList = this.unflattenParents(messageList, {uuid: null}, 'parentmessageid')
				// }
				// return this.$refs.roomFilters.orderBy(rooms);
				return this.sortByNested(this.sort, messageList);
			},
		},
		methods: {
			filteredMessages22() {
				var messageList = this.messageList;
				console.log("messageList: ", messageList);
				if (this.searchMessages) {
					messageList = messageList.filter(item => item.Name.toLowerCase().includes(this.searchMessages));
				}
				console.log("this.filt.fval: ", this.filt.fval);
				if (this.filt.fval == 'Sent') {
					// messageList = messageList.filter((item) => item.children && item.children.length);
					messageList = messageList.filter((item) => item.children);
				} else {
					messageList = messageList.filter((item) => item[this.filt.fkey] == this.filt.fval);
				}
				// if (this.searchMessages) {
				// 	messageList = this.unflattenParents(messageList, {uuid: null}, 'parentmessageid')
				// }
				// return this.$refs.roomFilters.orderBy(rooms);
				return this.sortByNested(this.sort, messageList);
			},
			// filterApis $root.filterApis(group, 'group')
			filterMessages(v, k) {
				Vue.set( this.filt, 'fkey', k );
				Vue.set( this.filt, 'fval', v );
			},
			myReadeds(item) {
				if (!item.lastMessage.isread && item.folder != 'Draft' && item.folder != 'Sent') {
					return true;
				} else {
					return false;
				}
			},
			async filterMessage(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					this.messageList = [];
					this.messageList.push(filter);
					this.setPage();
				}
			},
			async getMessageOptions(search, loading) {
				loading(true);
				this.messageOptions = await this.getList(abyss.ajax.messages + '?likename=' + search);
				loading(false);
			},
			selectType(typ) {
				var type = this.messageTypes.find((el) => el.uuid === typ );
				Vue.set(this.message,'messagetypeid',type.uuid);
			},
			cancelMessage() {
				var index = this.messageList.indexOf(this.message);
				this.messageList[index] = this.selectedMessage;
				this.message = _.cloneDeep(this.newMessage);
				this.selectedMessage = _.cloneDeep(this.newMessage);
				this.parentMessage = null;
				this.viewMessage = null;
				this.selected = null;
			},
			selectMessage(item, i) {
				this.fixProps(item);
				this.selectedMessage = _.cloneDeep(item);
				this.message = item;
				this.selected = i;
			},
			selectViewMessage(item, i) {
				// this.fixProps(item);
				// this.selectedMessage = _.cloneDeep(item);
				this.viewMessage = item;
				this.selected = i;
			},
			isSelected(i) {
				return i === this.selected;
			},
			fixProps(item) {
				this.fillProps(item);
				if (item.sendersubjectid == null) {
					Vue.set(item,'subjectid',this.$root.rootData.user.uuid);
				}
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				Vue.delete(item, 'messageType');
				Vue.delete(item, 'recipients');
				Vue.delete(item, 'sender');
				Vue.delete(item, 'receiver');
				Vue.delete(item, 'folder');
				Vue.delete(item, 'lastMessage');
				return item;
			},
			async deleteMessage(item) {
				// await this.deleteItem(abyss.ajax.messages, item, true);
				console.log("del: ", del);
			},
			async markAsStarred(ness) {
			},
			async starViewMessage() {
			},
			async messageAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					if (act === 'send') {
						this.fixProps(this.message);
						this.message.sentat = moment().toISOString();
						// var item = await this.addItem(abyss.ajax.messages, this.deleteProps(this.message), this.messageList);
						this.$emit('set-state', 'init');
						this.message = _.cloneDeep(this.newMessage);
					}
					if (act === 'create') {
						this.fixProps(this.message);
						// var item = await this.addItem(abyss.ajax.messages, this.deleteProps(this.message), this.messageList);
						this.$emit('set-state', 'init');
						this.message = _.cloneDeep(this.newMessage);
					}
					if (act === 'edit') {
						// var item = await this.editItem( abyss.ajax.messages, this.message.uuid, this.deleteProps(this.message), this.messageList );
						this.$emit('set-state', 'init');
						this.message = _.cloneDeep(this.newMessage);
						this.selected = null;
					}
				}
			},
			async setPage() {
				this.messageList.forEach(async (value, key) => {
					var type = _.find(this.messageTypes, { 'uuid': value.messagetypeid });
					Vue.set( value, 'messageType', type );
					var receiver = await this.getItem(abyss.ajax.subjects, value.receiversubjectid);
					Vue.set( value, 'receiver', receiver );
					var sender = await this.getItem(abyss.ajax.subjects, value.sendersubjectid);
					Vue.set( value, 'sender', sender );
					if (value.receiversubjectid == this.$root.rootData.user.uuid) {
						Vue.set( value, 'folder', 'Inbox' );
					}
					if (value.sendersubjectid == this.$root.rootData.user.uuid) {
						Vue.set( value, 'folder', 'Sent' );
					}
					if (!value.sentat) {
						Vue.set( value, 'folder', 'Draft' );
					}
					// if (value.parentmessageid) {
					// 	parent = this.messageList.find((el) => el.uuid == value.parentmessageid )
					// 	Vue.set( value, 'parentMessage', parent );
					// }
				});
				this.messageList = await this.unflattenParents(this.messageList, {uuid: null}, 'parentmessageid');
				this.messageList.forEach(async(value, key) => {
					var lastMessage = this.findUnread(value, 'lastMessage');
					console.log("lastMessage: ", lastMessage);
					if (lastMessage.length) {
						Vue.set( value, 'lastMessage', lastMessage[0] );
					}
				});
			},
			async getPage(p, d) {
				// var message_list = this.getList(abyss.ajax.my_messages + this.$root.rootData.user.uuid);
				var message_list = this.getList(abyss.ajax.messages);
				var message_types = this.getList(abyss.ajax.message_types);
				var [messageList, messageTypes] = await Promise.all([message_list, message_types]);
				Vue.set( this, 'messageList', messageList );
				Vue.set( this, 'messageTypes', messageTypes );
				await this.setPage();
				
				this.paginate = this.makePaginate(this.messageList);
				this.isLoading = false;
				this.preload();
			},
			findUnread(obj, key) {
				if (_.has(obj, key)){
					return [obj];
				}
				return _.flatten(_.map(obj, (v) => {
					return typeof v == "object" ? this.findUnread(v, key) : [];
				}), true);
			},
			async findUnread222(obj, key) {
				var res = [];
				_.forEach(obj, (v) => {
					if (typeof v == "object" && (v = this.findUnread(v, key)).length)
						res.push.apply(res, v);
				});
				return res;
			},
			async unflattenParents(array, parent, parentid) {
				var children = _.filter(array, child => child[parentid] == parent.uuid);
				if (!_.isEmpty(children)) {
					if (parent.uuid == null) {
					} else {
						parent['children'] = children[0];
					}
					_.each(children, child => {
						this.unflattenParents(array, child, parentid)
					});
				} else {
					parent['lastMessage'] = true;
				}
				return children;
			},
		},
		created() {
			this.$emit('set-page', 'messages', 'init');
			this.newMessage = _.cloneDeep(this.message);
			this.getPage(1);
		}
	});
});
