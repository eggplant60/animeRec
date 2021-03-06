(function () {
	'use strict';

	angular.module('app')
		.controller('AppCtrl', [
			'$log', 
			'$timeout', 
			'$mdDialog',
			'$window',
			'ApiService', 
			'CommonService', 
			'ConfService',
			AppCtrl]);

	function AppCtrl($log, $timeout, $dialog, $window, api, common, conf) {
		$log.debug('AppCtrl: start ---------------------');

		var vm = this;
		vm.searchEngine = 'https://google.com/search?tbm=isch&q='; // 'https://google.com/search?q=';
		
		/* 
		 * 設定情報読み取り
		 */
		vm.conf = conf.get();
		//vm.conf = angular.copy(conf.default);
		//conf.set(vm.conf);

		/* 
		 * ビューの列数を早く確定させたいため、先に番組表の枠を作成する
		 */
		vm.programList = common.createEmptyProgramList(vm.conf);
		console.debug(vm.programList);
		
		vm.inProcess = false;
		vm.allShow = true;
		vm.currentColumnId = 0;
		//vm.columnWidth = document.querySelector('#column0');
		const columnWidth = 353;
		
		/* 
		 * 番組表取得
		 */
		function initReload() {
			$log.debug('reload');
			//vm.inProcess = true;
			common.reload(vm.programList, vm.conf)
			.then((values) => {
				$log.debug('reload: get programList.');
				for (let i=0; i<vm.conf.display.columns; i++) {
					$timeout(() => {
						vm.programList[i].rowPrograms = values[i]; // 一度に更新しようとすると表示されない？
					}, i*100); // 左から順に処理
				}
				//vm.inProcess = false;
			})
			.catch((err) => {
				$log.error('reload: Error, can not get programList!');
			});	
		}

		initReload();

		/* 
		* 予約一覧取得を並行して動かす
		*/
		function mergeReserve() {
			$log.debug('merge');
			vm.inProcess = true;
			api.reservations.list().$promise
			.then((data) => {
				$log.debug('merge: get reservations.');
				$log.debug(data);
				for (let i=0; i<vm.conf.display.columns; i++) {
					$timeout(() => {
						let row = vm.programList[i].rowPrograms;
						row = common.merge(row, data);
					}, i*100); // 左から順に処理
				}
				vm.inProcess = false;
			})
			.catch((err) => {
				$log.error('merge: can not get reservations!');
				common.showLogin();
			});	
		}

		mergeReserve();

		/* 
		 * スクロールボタン
		 */
		vm.scrollToAbs = (columnId) => {
			if (columnId === -1) {
				columnId = vm.programList.length - 1;
			}
			$log.debug('scrollToAbs(' + columnId + ')');
			//$location.hash('column' + columnId);
			//$scroll();
			$window.scroll(columnWidth*columnId, 0, {behavior: 'smooth'});
			vm.currentColumnId = columnId;
		};

		vm.scrollToRel = (rel) => {
			//$log.debug(vm.columnWidth);
			//$log.debug($window.scrollX);
			//$log.debug('scrollToRel(' + rel + ')');
			let tmp = vm.currentColumnId + rel;
			if (tmp < 0) {
				tmp = 0;
			} else if (tmp > vm.programList.length-1) {
				tmp = vm.programList.length-1;
			}
			vm.scrollToAbs(tmp);
		};

		/*
		* 予約ボタン
		*/
		vm.onReserveButton = (program) => {
			if (vm.inProcess) {
				common.openInfo('更新処理が完了するまでお待ち下さい。');
				$log.debug('on reserve: return due to another process');
				return;
			}
			$log.debug('on reserve');
			let promise;
			if (!program.item_id) {
				promise = common.addReserve;
			} else {
				promise = common.removeReserve;
			}
			promise(program, vm.conf).then((val) => {
				$log.debug('on reserve: success');
				program = val;
				mergeReserve();
			}).catch((err) => {
				$log.error('on reserve: failed');
				$log.error(err);
			});
		};

		/* 
		* デバッグ用ダイアログ
		*/
		vm.openDetail = common.openDetail;

		/* 
		 * フィルターボタン
		 */
		vm.onFilter = () => {
			$log.debug('on filter');
			vm.allShow = !vm.allShow;
		};

		vm.recFilter = (program) => {
			return vm.allShow || program.item_id;
		};

		/* 
		 * リフレッシュボタン
		 */
		vm.onRefresh = () => {
			$log.debug('on reflesh');
			initReload();
			mergeReserve();
		};

		/* 
		 * バージョン
		 */
		vm.version = () => {
			$log.debug('version');
			common.showVersion();
		};

		/* 
		 * 設定ボタン
		 */
		vm.onConf = (type) => {
			$log.debug('on conf ' + type);
			switch(type) {
				case 'genre':
					vm.setConf(type, true);
					break;
				case 'rec':
					vm.setConf(type, false);
					break;
				case 'time':
					vm.setConf(type, true);
					break;
				case 'display':
					vm.setConf(type, true);
					break;
				default:
					$log.error('on conf error: undefined type');
			}
			$log.debug('on conf: finish');
		};

		/* 
		 * 設定ダイアログ
		 */
		vm.setConf = (type, reload) => {
			$log.debug('set conf ' + type);
			let oldConfType = angular.copy(vm.conf[type]);  // キャンセルされたときこの値に戻す
			$dialog.show({
				//targetEvent: ev,
				controller: ConfDialogCtrl,
				templateUrl: 'partials/dialog-' + type + '.html',
				parent: angular.element(document.body),
				clickOutsideToClose: true,
				fullscreen: false,
				locals: {
					confType: vm.conf[type]
				}
			})
			.then((val) => { // OK
				$log.debug('set conf ' + type + ': resolve');
				$log.debug(vm.conf[type]);
				conf.set(vm.conf); // save configuration
				if (reload) {
					vm.programList = common.createEmptyProgramList(vm.conf);
					initReload();
					mergeReserve();		
				}
			})
			.catch((err) => { // Cancel
				$log.debug('set conf ' + type + ': reject');
				vm.conf[type] = oldConfType;
			});
		};
	}
	// --- AppCtrl ここまで --- //

	/* 
	 * 設定画面のデータを管理するコントローラ
	 */
	function ConfDialogCtrl($scope, $mdDialog, confType) {
		$scope.conf = confType;
		// Promise の reject
		$scope.cancel = () => {
			$mdDialog.cancel('ConfDialogCtrl: cancel');
		};
		// Promise の resolve
		$scope.ok = () => {
			$mdDialog.hide('ConfDialogCtrl: hide');
		};
	}	

})();
