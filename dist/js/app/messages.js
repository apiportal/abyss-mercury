define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment', 'vue-select'], function(abyss, Vue, axios, VeeValidate, _, moment, VueSelect) {
	Vue.component('v-select', VueSelect.VueSelect);
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
					"readat": null
				},
				selectedMessage: {},
				newMessage: {},
				messageList: [],
				messageTypes: [],
				filterTxt: '',
				messageOptions: [],
				end: []
			};
		},
		methods: {
			async filterMessage(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					this.messageList = [];
					this.messageList.push(filter);
				}
			},
			async getMessageOptions(search, loading) {
				loading(true);
				this.messageOptions = await this.getList(abyss.ajax.messages + '?likename=' + search);
				loading(false);
			},
			selectType(typ) {
				var type = this.messageTypes.find((el) => el.uuid == typ );
				Vue.set(this.message,'messagetypeid',type.uuid);
			},
			cancelMessage() {
				var index = this.messageList.indexOf(this.message);
				this.messageList[index] = this.selectedMessage;
				this.message = _.cloneDeep(this.newMessage);
				this.selectedMessage = _.cloneDeep(this.newMessage);
				this.selected = null;
			},
			selectMessage(item, i) {
				this.fixProps(item);
				this.selectedMessage = _.cloneDeep(item);
				this.message = item;
				this.selected = i;
			},
			isSelected(i) {
				return i === this.selected;
			},
			fixProps(item) {
				this.fillProps(item);
				if (item.subjectid == null) {
					Vue.set(item,'subjectid',this.$root.rootData.user.uuid);
				}
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				Vue.delete(item, 'messageType');
				Vue.delete(item, 'receiver');
				return item;
			},
			async deleteMessage(item) {
				var del = await this.deleteItem(abyss.ajax.messages, item, true);
				console.log("del: ", del);
				if (del) {
					this.$toast('success', {title: 'ITEM DELETED', message: 'Item deleted successfully', position: 'topRight'});
					this.deleteResource(item);
				}
			},
			async messageAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					if (act == 'add') {
						this.fixProps(this.message);
						var item = await this.addItem(abyss.ajax.messages, this.deleteProps(this.message), this.messageList);
						this.$emit('set-state', 'init');
						this.message = _.cloneDeep(this.newMessage);
					}
					if (act == 'edit') {
						var item = await this.editItem( abyss.ajax.messages, this.message.uuid, this.deleteProps(this.message), this.messageList );
						this.$emit('set-state', 'init');
						this.message = _.cloneDeep(this.newMessage);
						this.selected = null;
					}
				}
			},
			async getPage(p, d) {
				// var message_list = this.getList(abyss.ajax.my_messages + this.$root.rootData.user.uuid);
				var message_list = this.getList(abyss.ajax.messages);
				var message_types = this.getList(abyss.ajax.message_types);
				var [messageList, messageTypes] = await Promise.all([message_list, message_types]);
				Vue.set( this, 'messageList', messageList );
				Vue.set( this, 'messageTypes', messageTypes );
				this.messageList.forEach(async (value, key) => {
					var type = _.find(this.messageTypes, { 'uuid': value.messagetypeid });
					Vue.set( value, 'messageType', type );
					var receiver = await this.getItem(abyss.ajax.subjects, value.receiversubjectid);
					Vue.set( value, 'receiver', receiver );
					var sender = await this.getItem(abyss.ajax.subjects, value.sendersubjectid);
					Vue.set( value, 'sender', sender );
				});
				this.paginate = this.makePaginate(this.messageList);
				this.isLoading = false;
				this.preload();
				console.timeEnd();
			},
		},
		created() {
			this.$emit('set-page', 'messages', 'init');
			this.newMessage = _.cloneDeep(this.message);
			console.time();
			this.getPage(1);
		}
	});
});