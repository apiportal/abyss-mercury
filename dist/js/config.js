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
	var abyssPath = 'abyss/oapi';
	var abyssYamlPath = 'abyss/openapi';
	var abyssJsonPath = 'data';
	var abyssCredentials = true;
	var abyssLocation = abyssProtocol + '://' + abyssHost + ':' + abyssPort + '/' + abyssPath;
	var abyssJsonLocation = abyssProtocol + '://' + abyssHost + ':' + abyssJsonPort + '/' + abyssJsonPath;
	var abyssYamlLocation = abyssProtocol + '://' + abyssHost + ':' + abyssYamlPort + '/' + abyssYamlPath;
	// https://dev2.apiportal.com/abyss/oapi/
	// https://dev2.apiportal.com/abyss/openapi/xxx.yaml
	var abyssDataList = {
		// https://dev2.apiportal.com/abyss/openapi/Util.yaml
		api_yaml_list: '/yaml-files',
		// https://dev2.apiportal.com/abyss/openapi/ApiState.yaml
		api_states_list: '/api-states',
		// https://dev2.apiportal.com/abyss/openapi/ApiVisibilityType.yaml
		api_visibility_list: '/api-visibility-types',
		// https://dev2.apiportal.com/abyss/openapi/ApiGroup.yaml
		api_group_list: '/api-groups',
		// https://dev2.apiportal.com/abyss/openapi/Subject.yaml
		subjects: '/subjects', //uuid
		user_list: '/subjects/users/', //ABYSSP-205 NOT/NOW /subjects/users/{uuid]
		app_list: '/subjects/apps/', //useruuid
		// https://dev2.apiportal.com/abyss/openapi/SubjectApp.yaml
		subject_app_list: '/subject-apps', //uuid N/A
		subject_app_subject_list: '/subject-apps/subject/', //uuid ABYSSP-183 GET
		subjects_changepassword: '/subjects/{uuid}/changepassword/', //2DO ABYSSP-76 PUT oldpassword,newpassword,confirmpassword,crudsubjectid
		// https://dev2.apiportal.com/abyss/openapi/ApiCategory.yaml
		api_category_list: '/api-categories',
		// https://dev2.apiportal.com/abyss/openapi/ApiTag.yaml
		api_tag_list: '/api-tags',
		// https://dev2.apiportal.com/abyss/openapi/SubjectGroup.yaml
		user_group_list: '/subject-groups',
		// https://dev2.apiportal.com/abyss/openapi/SubjectPermission.yaml
		permission_list: '/subject-permissions', //uuid
		permission_my_apis: '/subject-permissions/my-apis-subscriptions/subject/', //useruuid ABYSSP-182 GET
		permissions_app: '/subject-permissions/api-subscriptions/subject/', // appuuid ABYSSP-207
		// https://dev2.apiportal.com/abyss/openapi/Resource.yaml
		resources: '/resources/', // uuid
		resources_reference: '/resources/reference/', // uuid
		resources_subject: '/resources/subject/{uuid}', // uuid ABYSSP-244
		resources_type: '/resources/type/{uuid}', // uuid ABYSSP-244
		resources_organization: '/resources/organization/{uuid}', // uuid ABYSSP-244
		// https://dev2.apiportal.com/abyss/openapi/ResourceAction.yaml
		resource_actions: '/resource-actions/', // uuid
		resource_actions_type: '/resource-actions/type/', //2DO uuid ABYSSP-263
		// https://dev2.apiportal.com/abyss/openapi/ResourceType.yaml
		resource_types: '/resource-types/', // uuid
		// https://dev2.apiportal.com/abyss/openapi/Api.yaml
		api_list: '/apis/',
		my_api_list: '/apis/subject/',
		my_business_api_list: '/apis/businesses/subject/',
		my_proxy_api_list: '/apis/proxies/subject/',
		proxy_list: '/apis/proxies/',
		business_list: '/apis/businesses/',

		business_tag_subject: '/apis/businesses/tag/{tag}/subject/{uuid}/', //2DO ABYSSP-85
		business_category_subject: '/apis/businesses/category/{category}/subject/{uuid}/', //2DO ABYSSP-85
		business_group_subject: '/apis/businesses/group/{group}/subject/{uuid}/', //2DO ABYSSP-85
		proxies_tag_subject: '/apis/proxies/group/{group}/subject/{uuid}/', //2DO ABYSSP-85
		proxies_category_subject: '/apis/proxies/category/{category}/subject/{uuid}/', //2DO ABYSSP-85
		proxies_group_subject: '/apis/proxies/tag/{tag}/subject/{uuid}/', //2DO ABYSSP-85

		businesses_group_subject_aggregate: '/apis/businesses/subject/{uuid}/tags/aggregate/{aggregation}', //2DO ABYSSP-00
		businesses_group_subject: '/apis/businesses/subject/{uuid}/tags/', //2DO ABYSSP-00

		// https://dev2.apiportal.com/abyss/openapi/Organization.yaml
		organizations_list: '/organizations/',
		subject_organizations_list: '/subject-organizations/subject/',
		// https://dev2.apiportal.com/abyss/openapi/SubjectDirectoryType.yaml
		subject_directory_types: '/subject-directory-types',
		// https://dev2.apiportal.com/abyss/openapi/SubjectDirectory.yaml
		subject_directories_list: '/subject-directories',
		// https://dev2.apiportal.com/abyss/openapi/SubjectType.yaml
		subject_types: '/subject-types',
		// https://dev2.apiportal.com/abyss/openapi/SubjectMembership.yaml
		subject_memberships: '/subject-memberships',
		subject_memberships_subject: '/subject-memberships/subject/',
		// https://dev2.apiportal.com/abyss/openapi/ApiApiTag.yaml
		api_tag: '/api-api-tags', //uuid
		api_tag_subject: '/api-api-tags/subject/{uuid}', //2DO ABYSSP-00 GET
		api_tag_api: '/api-api-tags/api/{uuid}', //2DO ABYSSP-14 GET
		api_tag_proxies_subject: '/api-api-tags/proxies/subject/{uuid}', //2DO ABYSSP-14 GET
		api_tag_businesses_subject: '/api-api-tags/businesses/subject/{uuid}', //2DO ABYSSP-12 GET
		// https://dev2.apiportal.com/abyss/openapi/ApiApiGroup.yaml
		api_group: '/api-api-groups', //uuid
		api_group_subject: '/api-api-groups/subject/{uuid}', //2DO ABYSSP-18
		api_group_api: '/api-api-groups/api/{uuid}', //2DO ABYSSP-16
		api_group_proxies_subject: '/api-api-groups/proxies/subject/{uuid}', //2DO ABYSSP-20
		api_group_businesses_subject: '/api-api-groups/businesses/subject/{uuid}', //2DO ABYSSP-18
		// https://dev2.apiportal.com/abyss/openapi/ApiApiCategory.yaml
		api_category: '/api-api-categories',
		api_category_subject: '/api-api-categories/subject/{uuid}', //2DO ABYSSP-22
		api_category_api: '/api-api-categories/api/{uuid}', //2DO ABYSSP-00
		api_category_proxies_subject: '/api-api-categories/proxies/subject/{uuid}', //2DO ABYSSP-26
		api_category_businesses_subject: '/api-api-categories/businesses/subject/{uuid}', //2DO ABYSSP-24

		// https://dev2.apiportal.com/abyss/openapi/Policy.yaml
		policies_list: '/policies/',
		subject_policies_list: '/policies/subject/',
		// https://dev2.apiportal.com/abyss/openapi/PolicyType.yaml
		policy_types: '/policy-types',
		// https://dev2.apiportal.com/abyss/openapi/License.yaml
		licenses_list: '/licenses/',
		subject_licenses_list: '/licenses/subject/',
		// https://dev2.apiportal.com/abyss/openapi/ApiLicense.yaml
		api_licenses: '/api-licenses/',
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
		resource_access_tokens: '/resource-access-tokens/',
		resource_access_tokens_permission: '/resource-access-tokens/subject-permission/', //uuid
		validate_oas: '/validate-oas',
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
		// abyssDataList.subject_licenses_list = '/data/LICENSES.json';
	}
	var abyssAllDataList = Object.assign(abyssJsonList, abyssDataList);
	// console.log("abyssAllDataList: ", abyssAllDataList);
	return {
		name: 'Abyss Api Portal',
		version: 'V.0.0',
		thy: true,
		abyssVersion: abyssVersion,
		isAbyssSandbox: isAbyssSandbox,
		abyssLocation: abyssLocation,
		abyssYamlLocation: abyssYamlLocation,
		abyssCredentials: abyssCredentials,
		ajax: abyssAllDataList,
		echo: 'http://local.abyss.com/000',
		session: 'a51666ff540afd276ebd145681808149',
	};
});

