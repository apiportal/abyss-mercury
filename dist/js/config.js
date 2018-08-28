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
	var abyssPath = 'abyss/oapi';
	var abyssYamlPath = 'abyss/openapi';
	var abyssJsonPath = 'data';
	var abyssCredentials = true;
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
	}
	if (isAbyssSandbox === true) {
		// abyssDataList.policy_types = '/data/POLICYTYPES.json';
		// abyssDataList.policies = '/data/POLICIES.json';
	}
	var abyssAllDataList = Object.assign(abyssJsonList, abyssDataList);
	// console.log("abyssAllDataList: ", abyssAllDataList);
	return {
		name: 'Abyss Api Portal',
		version: 'V.0.0',
		thy: true,
		abyssVersion: abyssVersion,
		isAbyssSandbox: isAbyssSandbox,
		abyssGatewayUrl: abyssGatewayUrl,
		abyssLocation: abyssLocation,
		abyssYamlLocation: abyssYamlLocation,
		abyssCredentials: abyssCredentials,
		ajax: abyssAllDataList,
		echo: 'http://local.abyss.com/000',
		session: 'a51666ff540afd276ebd145681808149',
	};
});

