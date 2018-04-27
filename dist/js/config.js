define(['global'], function(abyss){
	var isAbyssSandbox = abyssSandbox;
	var abyssProtocol = 'http';
	var abyssHost = host;
	console.log("abyssHost: ", abyssHost);
	var abyssPort = '38082';
	var abyssJsonPort = '38081';
	var abyssPath = 'abyss';
	var abyssJsonPath = 'data';
	var abyssLocation = abyssProtocol + '://' + abyssHost + ':' + abyssPort + '/' + abyssPath;
	var abyssJsonLocation = abyssProtocol + '://' + abyssHost + ':' + abyssJsonPort + '/' + abyssJsonPath;
	var abyssDataList = {
		user_list: '/api/subject/getAll',
		user_group_list: '/user-groups/management',
		// permission_list: '/user-permissions/management',
	}
	var abyssJsonList = {
		index: '/index.json',
		my_api_list: '/my-api-list.json',
		my_api: '/my-api.json',
		api_category_list: '/api-category-list.json',
		api_tag_list: '/api-tag-list.json',
		api_group_list: '/api-group-list.json',
		permission_list: '/permission-list.json',
	}
	if (isAbyssSandbox === true) {
		if (location.host == 'local.abyss.com' || location.host == 'localhost:7882') {
			abyssLocation = 'http://local.abyss.com/000?file=http://local.abyss.com/data';
			abyssJsonLocation = abyssLocation;
		} else if (location.host == '192.168.21.180:18881') {
			abyssLocation = 'http://192.168.21.180:18881/000?file=http://192.168.21.180:18881/data';
			abyssJsonLocation = abyssLocation;
		}
		abyssDataList = {
			index: '/index.json',
			my_api_list: '/my-api-list.json',
			my_api: '/my-api.json',
			api_category_list: '/api-category-list.json',
			api_tag_list: '/api-tag-list.json',
			api_group_list: '/api-group-list.json',
			user_list: '/user-list-abyss.json',
			user_group_list: '/user-group-list-abyss.json',
			permission_list: '/permission-list.json',
		}
		abyssJsonList = {}
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
		ajax: abyssAllDataList,
		test: 'ffffffffffffffffff',
	}
});

