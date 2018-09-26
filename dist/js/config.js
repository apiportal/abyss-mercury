define(['global'], function(abyss){
	var isAbyssSandbox = abyssSandbox;
	var abyssProtocol = hostProtocol;
	// console.log("abyssProtocol: ", abyssProtocol);
	var abyssHost = host;
	var abyssVersion = version;
	// console.log("abyssHost: ", abyssHost);
	var abyssPort = hostPort;
	var abyssJsonPort = hostJsonPort;
	var abyssYamlPort = hostPort;
	var abyssGatewayPath = gatewayContext;
	var abyssGatewayPort = gatewayPort;
	var abyssSearch = searchAllUrl;
	var abyssPath = 'abyss/oapi';
	var abyssYamlPath = 'abyss/openapi';
	var abyssJsonPath = 'data';
	var abyssCredentials = true;
	var abyssUrl = abyssProtocol + '://' + abyssHost + ':' + abyssPort;
	var abyssLocation = abyssProtocol + '://' + abyssHost + ':' + abyssPort + '/' + abyssPath;
	var abyssJsonLocation = abyssProtocol + '://' + abyssHost + ':' + abyssJsonPort + '/' + abyssJsonPath;
	var abyssYamlLocation = abyssProtocol + '://' + abyssHost + ':' + abyssYamlPort + '/' + abyssYamlPath;
	var abyssGatewayUrl = abyssProtocol + '://' + abyssHost + ':' + abyssGatewayPort + '/' + abyssGatewayPath;
	// gateway url = hostProtocol+host+gatewayPort+gatewayContext
	// if (abyssHost.indexOf(".com") >= 0) {
	if (hostProtocol == 'https') {
		abyssLocation = abyssProtocol + '://' + abyssHost + '/' + abyssPath;
		abyssJsonLocation = abyssProtocol + '://' + abyssHost + '/' + abyssJsonPath;
		abyssYamlLocation = abyssProtocol + '://' + abyssHost + '/' + abyssYamlPath;
		abyssGatewayUrl = abyssProtocol + '://' + abyssHost + '/' + abyssGatewayPath;
	}
	// console.log("abyssLocation: ", abyssLocation);
	// console.log("abyssJsonLocation: ", abyssJsonLocation);
	// console.log("abyssYamlLocation: ", abyssYamlLocation);
	// console.log("abyssGatewayUrl: ", abyssGatewayUrl);
	// https://dev2.apiportal.com/abyss/oapi/
	// https://dev2.apiportal.com/abyss/openapi/xxx.yaml
	var abyssDataList = {
		// https://dev2.apiportal.com/abyss/openapi/Util.yaml
		api_yaml_list: '/yaml-files',
		// https://dev2.apiportal.com/abyss/openapi/ApiState.yaml
		api_states_list: '/api-states',
		// https://dev2.apiportal.com/abyss/openapi/ApiVisibilityType.yaml
		api_visibility_list: '/api-visibility-types',
		// https://dev2.apiportal.com/abyss/openapi/Subject.yaml
		subjects: '/subjects', //uuid
		user_list: '/subjects/users/', // must / (no put,post,delete methods with uuid, yaml has )
		app_list: '/subjects/apps/', //  must / (no put,post,delete methods with uuid, yaml has )
		user_group_list: '/subjects/groups/', //  must / (no put,post,delete methods with uuid, yaml has )
		// user_group_list: '/subject-groups',
		// https://dev2.apiportal.com/abyss/openapi/SubjectApp.yaml
		subject_app_list: '/subject-apps', //uuid N/A
		subject_app_subject_list: '/subject-apps/subject/', //uuid ABYSSP-183 GET
		subjects_changepassword: '/subjects/{uuid}/changepassword/', //2DO ABYSSP-76 PUT oldpassword,newpassword,confirmpassword,crudsubjectid
		// https://dev2.apiportal.com/abyss/openapi/SubjectGroup.yaml
		// https://dev2.apiportal.com/abyss/openapi/SubjectPermission.yaml
		permission_list: '/subject-permissions', //uuid
		permission_my_apis: '/subject-permissions/my-apis-subscriptions/subject/', //useruuid ABYSSP-182 GET
		permissions_app: '/subject-permissions/api-subscriptions/subject/', // appuuid ABYSSP-207
		permissions_subject: '/subject-permissions/subject/', // appuuid ABYSSP-280
		// https://dev2.apiportal.com/abyss/openapi/Resource.yaml
		resources: '/resources', // uuid
		resources_reference: '/resources/reference', // uuid
		resources_subject: '/resources/subject/', // uuid ABYSSP-244
		resources_type: '/resources/type/', // uuid ABYSSP-244
		resources_organization: '/resources/organization/', // uuid ABYSSP-244
		// https://dev2.apiportal.com/abyss/openapi/ResourceAction.yaml
		resource_actions: '/resource-actions/', // uuid
		resource_actions_type: '/resource-actions/type/', //N/A uuid instead resource_actions ABYSSP-263
		// https://dev2.apiportal.com/abyss/openapi/ResourceType.yaml
		resource_types: '/resource-types/', // uuid
		// https://dev2.apiportal.com/abyss/openapi/Api.yaml
		apis_shared_with_me: '/apis/sharedwith/subject/', // uuid
		apis_shared_by_me: '/apis/sharedby/subject/', // uuid
		api_list: '/apis/',
		my_api_list: '/apis/subject/',
		my_business_api_list: '/apis/businesses/subject/',
		my_proxy_api_list: '/apis/proxies/subject/',
		proxy_list: '/apis/proxies', // must /, ! inline
		business_list: '/apis/businesses', // must /, ! inline
		// https://dev2.apiportal.com/abyss/openapi/Organization.yaml
		organizations_list: '/organizations',
		subject_organizations_list: '/subject-organizations/subject',
		subject_organizations: '/subject-organizations',
		// https://dev2.apiportal.com/abyss/openapi/SubjectDirectoryType.yaml
		subject_directory_types: '/subject-directory-types',
		// https://dev2.apiportal.com/abyss/openapi/SubjectDirectory.yaml
		subject_directories_list: '/subject-directories',
		// https://dev2.apiportal.com/abyss/openapi/SubjectType.yaml
		subject_types: '/subject-types',
		// https://dev2.apiportal.com/abyss/openapi/SubjectMembership.yaml
		subject_memberships: '/subject-memberships',
		subject_memberships_subject: '/subject-memberships/subject/',
		// https://dev2.apiportal.com/abyss/openapi/Policy.yaml
		policies: '/policies',
		subject_policies_list: '/policies/subject/',
		// https://dev2.apiportal.com/abyss/openapi/PolicyType.yaml
		policy_types: '/policy-types',
		// https://dev2.apiportal.com/abyss/openapi/License.yaml
		licenses: '/licenses',
		subject_licenses_list: '/licenses/subject/',
		// https://dev2.apiportal.com/abyss/openapi/ApiLicense.yaml
		api_licenses: '/api-licenses',
		api_licenses_api: '/api-licenses/api/',
		api_licenses_license: '/api-licenses/license/',
		// https://dev2.apiportal.com/abyss/openapi/Contract.yaml
		contracts: '/contracts',
		contracts_api: '/contracts/api/',
		contracts_app: '/contracts/app/',
		contracts_license: '/contracts/license/',
		// https://dev2.apiportal.com/abyss/openapi/ContractState.yaml
		contract_states: '/contract-states',
		// https://dev2.apiportal.com/abyss/openapi/ResourceAccessToken.yaml
		resource_access_tokens: '/resource-access-tokens',
		resource_access_tokens_permission: '/resource-access-tokens/subject-permission', //uuid
		validate_oas: '/validate-oas',
		// https://dev2.apiportal.com/abyss/openapi/AccessManager.yaml
		access_managers: '/access-managers',
		// https://dev2.apiportal.com/abyss/openapi/AccessManagerType.yaml
		access_manager_types: '/access-manager-types',
		// https://dev2.apiportal.com/abyss/openapi/Message.yaml
		messages: '/messages',
		// https://dev2.apiportal.com/abyss/openapi/MessageType.yaml
		message_types: '/message-types',

		// https://dev2.apiportal.com/abyss/openapi/ApiCategory.yaml
		api_category_list: '/api-categories', // GPDP
		// https://dev2.apiportal.com/abyss/openapi/ApiTag.yaml
		api_tag_list: '/api-tags', // GPDP
		// https://dev2.apiportal.com/abyss/openapi/ApiGroup.yaml
		api_group_list: '/api-groups', // GPDP

		// https://dev2.apiportal.com/abyss/openapi/ApiApiTag.yaml
		api_tag: '/api-api-tags', //uuid GPDP apiid, apitagid
		api_tag_api: '/api-api-tags/api/', // uuid GET only uuid, name
		api_tag_api_tag: '/api-api-tags/api/{uuid}/tag/{groupuuid}', //2DO uuid GET only 
		api_tag_subject: '/api-api-tags/subject/', // uuid GET only uuid, name
		api_tag_proxies_subject: '/api-api-tags/proxies/subject/', //2DO uuid GET only uuid, name
		api_tag_businesses_subject: '/api-api-tags/businesses/subject/', //2DO uuid GET only uuid, name
		// https://dev2.apiportal.com/abyss/openapi/ApiApiGroup.yaml
		api_group: '/api-api-groups', //uuid GPDP apiid, apigroupid
		api_group_api: '/api-api-groups/api/', // uuid GET only uuid, name
		api_group_api_group: '/api-api-groups/api/{uuid}/group/{groupuuid}', //2DO uuid GET only 
		api_group_subject: '/api-api-groups/subject/', // uuid GET only uuid, name
		api_group_proxies_subject: '/api-api-groups/proxies/subject/', //2DO uuid GET only uuid, name
		api_group_businesses_subject: '/api-api-groups/businesses/subject/', //2DO uuid GET only uuid, name
		// https://dev2.apiportal.com/abyss/openapi/ApiApiCategory.yaml
		api_category: '/api-api-categories', //uuid GPDP apiid, apicategoryid
		api_category_api: '/api-api-categories/api/', // uuid GET only uuid, name
		api_category_api_category: '/api-api-categories/api/{uuid}/category/{categoryuuid}', //2DO uuid GET only
		api_category_subject: '/api-api-categories/subject/', // uuid GET only uuid, name
		api_category_proxies_subject: '/api-api-categories/proxies/subject/', //2DO uuid GET only uuid, name
		api_category_businesses_subject: '/api-api-categories/businesses/subject/', //2DO uuid GET only uuid, name

		business_tag_subject: '/apis/businesses/tag/{tag}/subject/', // GET api list
		business_category_subject: '/apis/businesses/category/{category}/subject/', // GET api list
		business_group_subject: '/apis/businesses/group/{group}/subject/', // GET api list
		proxies_tag_subject: '/apis/proxies/group/{group}/subject/', // GET api list
		proxies_category_subject: '/apis/proxies/category/{category}/subject/', // GET api list
		proxies_group_subject: '/apis/proxies/tag/{tag}/subject/', // GET api list

		businesses_group_subject_aggregate: '/apis/businesses/subject/{uuid}/tags/aggregate/{aggregation}', //2DO https://dev2.apiportal.com/abyss/oapi/apis/businesses/subject/9820d2aa-eb02-4a58-8cc5-8b9a89504df9/tags/aggregate/count
		businesses_group_subject: '/apis/businesses/subject/{uuid}/tags/', //2DO https://dev2.apiportal.com/abyss/oapi/apis/businesses/subject/9820d2aa-eb02-4a58-8cc5-8b9a89504df9/tags/ ?? GETS ALL APIS

	};
	var abyssJsonList = {
		index: '/index.json',
	};
	/*if (isAbyssSandbox === true) {
		if (location.host == 'local.abyss.com' || location.host == 'localhost:7882' || location.host == 'localhost:7880') {
			// abyssLocation = 'http://local.abyss.com/000?file=http://local.abyss.com/data';
			// abyssLocation = 'http://local.abyss.com/000?file=http://dev2.apiportal.com/abyss/oapi';
			abyssLocation = 'http://dev2.apiportal.com/abyss/oapi';
			abyssDataList = {};
		} else if (location.host == '192.168.21.180:18881' || location.host == '192.168.1.80:8000') {
			abyssLocation = 'http://' + location.host + '/000?file=' + 'http://' + location.host + '/data';
			abyssDataList = {};
		}
		abyssJsonLocation = abyssLocation;
		// abyssCredentials = false;
		abyssJsonList = {};
	}*/
	for (var key in abyssDataList) {
		if (abyssDataList.hasOwnProperty(key)) {
			abyssDataList[key] = abyssLocation + abyssDataList[key];
		}
	}
	for (var key in abyssJsonList) {
		if (abyssJsonList.hasOwnProperty(key)) {
			abyssJsonList[key] = abyssJsonLocation + abyssJsonList[key];
		}
	}
	if (isAbyssSandbox === true) {
		abyssYamlLocation = '/000?file=' + abyssYamlLocation;
		// abyssDataList.policy_types = '/data/POLICYTYPES.json';
		// abyssDataList.policies = '/data/POLICIES.json';
	}
	var abyssAllDataList = Object.assign(abyssJsonList, abyssDataList);
	// console.log("abyssAllDataList: ", abyssAllDataList);
	var testerList = {
		ilkiz: '9820d2aa-eb02-4a58-8cc5-8b9a89504df9',
		faik: '32c9c734-11cb-44c9-b06f-0b52e076672d',
		halil: 'd6bba21e-6d4c-4f87-897e-436bd97d41c0',
		faber: 'c053c421-cb53-4ceb-acd0-a77c1f65438b',
		abyss: '3c65fafc-8f3a-4243-9c4e-2821aa32d293',
		monasdyas: '89db8aca-51b3-435b-a79d-e1f4067d2076',
		org: 'monasdyas',
	}
	return {
		name: 'Abyss Api Portal',
		version: 'V.0.0',
		thy: true,
		abyssVersion: abyssVersion,
		isAbyssSandbox: isAbyssSandbox,
		abyssGatewayUrl: abyssGatewayUrl,
		abyssUrl: abyssUrl,
		abyssLocation: abyssLocation,
		abyssYamlLocation: abyssYamlLocation,
		abyssCredentials: abyssCredentials,
		abyssSearch: abyssSearch,
		ajax: abyssAllDataList,
		echoPost: 'http://192.168.10.38:11080/post',
		sandbox: {
			session: 'a51666ff540afd276ebd145681808149',
			// userId: testerList.faik,
			// orgId: testerList.abyss,
			userId: testerList.ilkiz,
			orgId: testerList.monasdyas,
			orgName: testerList.org,
		},
		defaultIds: {
			accessManager: '6223ebbe-b30f-4976-bcf9-364003142379',
			invokeApi: 'c5639f00-94c9-4cc9-8ad9-df76f9d162a8',
			abyssPlatform: 'ebe1ca8b-a891-42e9-b053-f4ac3829653c',
			ownApp: 'e085cb50-8a98-4511-bc8a-00edabbae8a9',
			usePlatform: '2318f036-10e5-41b0-8b51-24adbffd2a2e',
			groupAdmin: 'd911bf07-7ae8-46dd-9039-295f79575a90',
			viewApi: 'bf0b6ac2-7d07-49c6-b3f8-0fd7c927126e',
			editApi: '7e55b086-75e0-4209-9cc5-51baa38393ed',
			consumeApp: '761c8386-4624-416e-b9e4-b59ea2c597fc',
			contractActivated: '846282ec-1329-4a3c-908b-672b4de3ade2',
			organization: '3c65fafc-8f3a-4243-9c4e-2821aa32d293',
			subjectTypeApp: 'ca80dd37-7484-46d3-b4a1-a8af93b2d3c6',
			subjectTypeUser: '21371a15-04f8-445e-a899-006ee11c0e09',
			subjectTypeGroup: 'c5ef2da7-b55e-4dec-8be3-96bf30255781',
			apiStateDraft: 'dccb1796-9338-4ae8-a0d9-02654d1e2c6d',
			apiVisibilityPrivate: '043d4827-cff4-43f9-9d5b-782d1f83b3f0',
			apiVisibilityPublic: 'e63c2874-aa12-433c-9dcf-65c1e8738a14',
		}
		// abyss.defaultIds.invokeApi
		// abyss.defaultIds.accessManager
		// abyss.defaultIds.abyssPlatform
		// abyss.defaultIds.ownApp
		// abyss.defaultIds.usePlatform
		// abyss.defaultIds.groupAdmin
		// abyss.defaultIds.viewApi
		// abyss.defaultIds.editApi
		// abyss.defaultIds.consumeApp
		// abyss.defaultIds.contractActivated
		// abyss.defaultIds.organization
		// abyss.defaultIds.subjectTypeApp
		// abyss.defaultIds.subjectTypeUser
		// abyss.defaultIds.subjectTypeGroup
		// abyss.defaultIds.apiStateDraft
		// abyss.defaultIds.apiVisibilityPrivate
		// abyss.defaultIds.apiVisibilityPublic
	};
});

