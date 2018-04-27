define(['global'], function(abyss){
	var abyssSandbox = true;
	var abyssProtocol = 'http';
	var abyssHost2 = abyssHost;
	console.log("abyssHost: ", abyssHost);
	console.log("abyssHost2: ", abyssHost2);
	var abyssPort = '38082';
	var abyssPath = 'abyss';
	var abyssLocation = abyssProtocol + '://' + abyssHost2 + ':' + abyssPort + '/' + abyssPath;
	var abyssDataList = {
		index: '/index.json',
		my_api_list: '/my-api-list.json',
		my_api: '/my-api.json',
		api_category_list: '/api-category-list.json',
		api_tag_list: '/api-tag-list.json',
		api_group_list: '/api-group-list.json',
		user_list: 'api/subject/getAll',
		user_group_list: '/user-groups/management',
		// permission_list: '/user-permissions/management',
		permission_list: '/permission-list.json',
	}
	if (abyssSandbox) {
		if (location.host == 'local.abyss.com' || location.host == 'localhost:7882') {
			abyssLocation = 'http://local.abyss.com/000?file=http://local.abyss.com/data';
		} else if (location.host == '192.168.21.180:18881') {
			abyssLocation = 'http://192.168.21.180:18881/000?file=http://192.168.21.180:18881/data';
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
	}
	for (var key in abyssDataList) {
		if (abyssDataList.hasOwnProperty(key)) {
			abyssDataList[key] = abyssLocation + abyssDataList[key];
		}
	}
	return {
		name: 'Abyss Api Portal',
		version: 'V.0.0',
		thy: true,
		abyssLocation: abyssLocation,
		ajax: abyssDataList,
		test: 'ffffffffffffffffff',
	}
});

