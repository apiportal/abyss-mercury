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
	var abyssYamlList = [
		{"yaml":"Api", "path":"apis", "css": ""},
		{"yaml":"ApiApiCategory", "path":"api-api-categories", "css": ""},
		{"yaml":"ApiApiGroup", "path":"api-api-groups", "css": ""},
		{"yaml":"ApiApiTag", "path":"api-api-tags", "css": ""},
		{"yaml":"ApiCategory", "path":"api-categories", "css": ""},
		{"yaml":"ApiGroup", "path":"api-groups", "css": ""},
		// {"yaml":"ApiLicense", "path":"api-license", "css": ""},
		{"yaml":"ApisOfSubject", "path":"is/subjects/9820d2aa-eb02-4a58-8cc5-8b9a89504df9", "css": "txt-red"},
		{"yaml":"ApiState", "path":"api-states", "css": ""},
		{"yaml":"ApiTag", "path":"api-tags", "css": ""},
		{"yaml":"ApiVisibilityType", "path":"api-visibility-types", "css": ""},
		{"yaml":"Contract", "path":"contracts", "css": "txt-red"},
		{"yaml":"ContractState", "path":"contract-states", "css": "txt-red"},
		{"yaml":"License", "path":"licenses", "css": ""},
		{"yaml":"Organization", "path":"organizations", "css": ""},
		{"yaml":"Policy", "path":"policies", "css": "txt-red"},
		{"yaml":"PolicyType", "path":"policy-types", "css": "txt-red"},
		{"yaml":"Resource", "path":"resources", "css": "txt-red"},
		{"yaml":"ResourceAction", "path":"resource-actions", "css": "txt-red"},
		{"yaml":"ResourceType", "path":"resource-types", "css": "txt-red"},
		{"yaml":"Subject", "path":"subjects", "css": ""},
		{"yaml":"SubjectActivation", "path":"subject-activations", "css": "txt-red"},
		{"yaml":"SubjectApp", "path":"subject-apps", "css": "txt-red"},
		{"yaml":"SubjectDirectory", "path":"subject-directories", "css": ""},
		{"yaml":"SubjectDirectoryType", "path":"subject-directory-types", "css": ""},
		{"yaml":"SubjectGroup", "path":"subject-groups", "css": ""},
		{"yaml":"SubjectMembership", "path":"subject-memberships", "css": ""},
		{"yaml":"SubjectPermission", "path":"subject-permissions", "css": ""},
		{"yaml":"SubjectType", "path":"subject-types", "css": ""}
	];
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
		user_list: '/subjects',
		// https://dev2.apiportal.com/abyss/openapi/ApiCategory.yaml
		api_category_list: '/api-categories',
		// https://dev2.apiportal.com/abyss/openapi/ApiTag.yaml
		api_tag_list: '/api-tags',
		// https://dev2.apiportal.com/abyss/openapi/SubjectGroup.yaml
		user_group_list: '/subject-groups',
		// https://dev2.apiportal.com/abyss/openapi/SubjectPermission.yaml
		permission_list: '/subject-permissions',
		// https://dev2.apiportal.com/abyss/openapi/Api.yaml
		api_list: '/apis/',
		my_api_list: '/apis/subject/',
		my_business_api_list: '/apis/businesses/subject/',
		my_proxy_api_list: '/apis/proxies/subject/',
		proxy_list: '/apis/proxies/',
		business_list: '/apis/businesses/',
		// https://dev2.apiportal.com/abyss/openapi/Organization.yaml
		organizations_list: '/organizations',
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
		api_tag: '/api-api-tags',
		// https://dev2.apiportal.com/abyss/openapi/ApiApiGroup.yaml
		api_group: '/api-api-groups',
		// https://dev2.apiportal.com/abyss/openapi/ApiApiCategory.yaml
		api_category: '/api-api-categories',

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
	abyssYamlList.forEach((value, key) => {
		value.yurl = abyssYamlLocation + '/' + value.yaml + '.yaml';
		value.aurl = abyssLocation + '/' + value.path + '/';
	});
	if (isAbyssSandbox === true) {
		// abyssDataList.policy_types = '/data/POLICYTYPES.json';
		// abyssDataList.policies = '/data/POLICIES.json';
		// abyssDataList.subject_licenses_list = '/data/LICENSES.json';
	}
	var abyssAllDataList = Object.assign(abyssJsonList, abyssDataList);
	console.log("abyssAllDataList: ", abyssAllDataList);
	return {
		name: 'Abyss Api Portal',
		version: 'V.0.0',
		thy: true,
		abyssVersion: abyssVersion,
		abyssYamlList: abyssYamlList,
		isAbyssSandbox: isAbyssSandbox,
		abyssLocation: abyssLocation,
		abyssYamlLocation: abyssYamlLocation,
		abyssCredentials: abyssCredentials,
		ajax: abyssAllDataList,
		echo: 'http://local.abyss.com/000',
		session: 'e51666ff540afd276ebd145681808149',
	};
});

