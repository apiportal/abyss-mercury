define(['global'], function(abyss){
	var isAbyssSandbox = abyssSandbox;
	var abyssProtocol = hostProtocol;
	console.log("abyssProtocol: ", abyssProtocol);
	var abyssHost = host;
	console.log("abyssHost: ", abyssHost);
	var abyssPort = hostPort;
	var abyssJsonPort = hostJsonPort;
	var abyssPath = 'abyss/oapi';
	var abyssJsonPath = 'data';
	var abyssCredentials = true;
	var abyssLocation = abyssProtocol + '://' + abyssHost + ':' + abyssPort + '/' + abyssPath;
	var abyssJsonLocation = abyssProtocol + '://' + abyssHost + ':' + abyssJsonPort + '/' + abyssJsonPath;
	/*var abyssDataList = {
		user_list: '/api/subject/getAll',
		user_add: '/api/subject/addSubject',
		user_update: '/api/subject/getAll',
		user_delete: '/api/subject/getAll',
		user_group_list: '/api/subjectgroup/getAll',
		permission_list: '/api/subjectpermission/getAll',
			index: '/api/subject/getIndex',
			my_api_list: '/api/my-apis/getAll',
			my_api: '/api/my-apis/getAll',
	};*/
	var abyssDataList = {
		api_states_list: '/api-states', //ApiState.yaml
		api_visibility_list: '/api-visibility-types', //ApiVisibilityType.yaml
		api_group_list: '/api-groups', //ApiGroup.yaml
		user_list: '/subjects', //Subject.yaml
		api_category_list: '/api-categories', //ApiCategory.yaml
		api_tag_list: '/api-tags', //ApiTag.yaml
		user_group_list: '/subject-groups', //SubjectGroup.yaml
		permission_list: '/subject-permissions', //SubjectPermission.yaml
		my_api_list: '/apis', //Api.yaml
	};
	var abyssJsonList = {
		index: '/index.json',
	};
	if (isAbyssSandbox === true) {
		if (location.host == 'local.abyss.com' || location.host == 'localhost:7882' || location.host == 'localhost:7880') {
			// abyssLocation = 'http://local.abyss.com/000?file=http://local.abyss.com/data';
			abyssLocation = 'http://local.abyss.com/000?file=http://dev2.apiportal.com/abyss/oapi';
			abyssDataList = {
				api_states_list: '/api-states', //ApiState.yaml
				api_visibility_list: '/api-visibility-types', //ApiVisibilityType.yaml
				api_group_list: '/api-groups', //ApiGroup.yaml
				user_list: '/subjects', //Subject.yaml
				api_category_list: '/api-categories', //ApiCategory.yaml
				api_tag_list: '/api-tags', //ApiTag.yaml
				user_group_list: '/subject-groups', //SubjectGroup.yaml
				permission_list: '/subject-permissions', //SubjectPermission.yaml
				my_api_list: '/apis', //Api.yaml
			};
		} else if (location.host == '192.168.21.180:18881' || location.host == 'http://192.168.1.80:8000') {
			abyssLocation = location.host + '/000?file=' + location.host + '/data';
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
		abyssCredentials = false;
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
	console.log("abyssAllDataList: ", abyssAllDataList);
	return {
		name: 'Abyss Api Portal',
		version: 'V.0.0',
		thy: true,
		abyssLocation: abyssLocation,
		abyssCredentials: abyssCredentials,
		ajax: abyssAllDataList,
		test: 'ffffffffffffffffff',
	};
});

