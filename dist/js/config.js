define(['global'], function(abyss){
	var isAbyssSandbox = abyssSandbox;
	var abyssProtocol = hostProtocol;
	// console.log("abyssProtocol: ", abyssProtocol);
	var abyssHost = host;
	// console.log("abyssHost: ", abyssHost);
	var abyssPort = hostPort;
	var abyssJsonPort = hostJsonPort;
	var abyssPath = 'abyss/oapi';
	var abyssJsonPath = 'data';
	var abyssCredentials = true;
	var abyssLocation = abyssProtocol + '://' + abyssHost + ':' + abyssPort + '/' + abyssPath;
	var abyssJsonLocation = abyssProtocol + '://' + abyssHost + ':' + abyssJsonPort + '/' + abyssJsonPath;
	var abyssDataList = {
		// http://dev2.apiportal.com/abyss/openapi/ApiState.yaml
		api_states_list: '/api-states',
		// http://dev2.apiportal.com/abyss/openapi/ApiVisibilityType.yaml
		api_visibility_list: '/api-visibility-types',
		// http://dev2.apiportal.com/abyss/openapi/ApiGroup.yaml
		api_group_list: '/api-groups',
		// http://dev2.apiportal.com/abyss/openapi/Subject.yaml
		user_list: '/subjects',
		// http://dev2.apiportal.com/abyss/openapi/ApiCategory.yaml
		api_category_list: '/api-categories',
		// http://dev2.apiportal.com/abyss/openapi/ApiTag.yaml
		api_tag_list: '/api-tags',
		// http://dev2.apiportal.com/abyss/openapi/SubjectGroup.yaml
		user_group_list: '/subject-groups',
		// http://dev2.apiportal.com/abyss/openapi/SubjectPermission.yaml
		permission_list: '/subject-permissions',
		// http://dev2.apiportal.com/abyss/openapi/Api.yaml
		api_list: '/apis',
		my_api_list: '/apis/subject',
		// http://dev2.apiportal.com/abyss/openapi/Organization.yaml
		organizations_list: '/organizations',
		// http://dev2.apiportal.com/abyss/openapi/SubjectDirectoryType.yaml
		subject_directory_types: '/subject-directory-types',
		// http://dev2.apiportal.com/abyss/openapi/SubjectDirectory.yaml
		subject_directories_list: '/subject-directories',
		// http://dev2.apiportal.com/abyss/openapi/SubjectType.yaml
		subject_types: '/subject-types',
		// http://dev2.apiportal.com/abyss/openapi/SubjectMembership.yaml
		subject_memberships: '/subject-memberships',
	};
	var abyssJsonList = {
		index: '/index.json',
	};
	if (isAbyssSandbox === true) {
		if (location.host == 'local.abyss.com' || location.host == 'localhost:7882' || location.host == 'localhost:7880') {
			// abyssLocation = 'http://local.abyss.com/000?file=http://local.abyss.com/data';
			// abyssLocation = 'http://local.abyss.com/000?file=http://dev2.apiportal.com/abyss/oapi';
			abyssLocation = 'http://dev2.apiportal.com/abyss/oapi';
			abyssDataList = {
				// http://dev2.apiportal.com/abyss/openapi/ApiState.yaml
				api_states_list: '/api-states',
				// http://dev2.apiportal.com/abyss/openapi/ApiVisibilityType.yaml
				api_visibility_list: '/api-visibility-types',
				// http://dev2.apiportal.com/abyss/openapi/ApiGroup.yaml
				api_group_list: '/api-groups',
				// http://dev2.apiportal.com/abyss/openapi/Subject.yaml
				user_list: '/subjects',
				// http://dev2.apiportal.com/abyss/openapi/ApiCategory.yaml
				api_category_list: '/api-categories',
				// http://dev2.apiportal.com/abyss/openapi/ApiTag.yaml
				api_tag_list: '/api-tags',
				// http://dev2.apiportal.com/abyss/openapi/SubjectGroup.yaml
				user_group_list: '/subject-groups',
				// http://dev2.apiportal.com/abyss/openapi/SubjectPermission.yaml
				permission_list: '/subject-permissions',
				// http://dev2.apiportal.com/abyss/openapi/Api.yaml
				api_list: '/apis',
				my_api_list: '/apis/subject',
				// http://dev2.apiportal.com/abyss/openapi/Organization.yaml
				organizations_list: '/organizations',
				// http://dev2.apiportal.com/abyss/openapi/SubjectDirectoryType.yaml
				subject_directory_types: '/subject-directory-types',
				// http://dev2.apiportal.com/abyss/openapi/SubjectDirectory.yaml
				subject_directories_list: '/subject-directories',
				// http://dev2.apiportal.com/abyss/openapi/SubjectType.yaml
				subject_types: '/subject-types',
				// http://dev2.apiportal.com/abyss/openapi/SubjectMembership.yaml
				subject_memberships: '/subject-memberships',
			};
		} else if (location.host == '192.168.21.180:18881' || location.host == '192.168.1.80:8000') {
			abyssLocation = 'http://' + location.host + '/000?file=' + 'http://' + location.host + '/data';
			abyssDataList = {
				api_group_list: '/api-group-list.json',
				user_list: '/subjects.json',
				api_category_list: '/api-category-list.json',
				api_tag_list: '/api-tag-list.json',
				user_group_list: '/user-group-list-abyss.json',
				permission_list: '/permission-list.json',

				index: '/index.json',
				my_api_list: '/my-apis.json',
				my_api_list_old: '/my-api-list.json',
				my_api: '/my-api.json',
				my_api_old: '/my-api-old.json',
			};
		}
		abyssJsonLocation = abyssLocation;
		// abyssCredentials = false;
		abyssJsonList = {};
	}
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
	var abyssAllDataList = Object.assign(abyssJsonList, abyssDataList);
	// console.log("abyssAllDataList: ", abyssAllDataList);
	return {
		name: 'Abyss Api Portal',
		version: 'V.0.0',
		thy: true,
		isAbyssSandbox: isAbyssSandbox,
		abyssLocation: abyssLocation,
		abyssCredentials: abyssCredentials,
		ajax: abyssAllDataList,
		echo: 'http://local.abyss.com/000',
		session: '4b1ed92fb3ebe54c6c5bd33543eef1d2',
	};
});

