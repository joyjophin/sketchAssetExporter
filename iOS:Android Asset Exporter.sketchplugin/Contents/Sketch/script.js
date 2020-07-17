function beginExport(context) {
	JJ.assetExporter.exportToSelectedFolder(context);	
}

var JJ = {};
JJ.assetExporter = {
	documentMetadata: null,

	exportToSelectedFolder: function(context, isRequestNewConfig) {
		if (!context.selection.count()) { return; }

		JJ.assetExporter.documentMetadata = context.document.mutableUIMetadata();

		var exportConfig = JJ.exportConfig.get(context),
			isSuccess;

		if (!exportConfig) { return; }

		isSuccess = JJ.assetExporter._export(context, exportConfig);

		if (!isSuccess) { return; }
		
		else {
			context.document.showMessage("Hurray! All your assets are exported successfully! 🤘😎");
		}
	},

	_export: function(context, config) {
		var selection = context.selection,
			doc = context.document,
			platforms = { "android": "Android", "ios": "iOS" },
			isSuccess = true,
			isStop;

		for (var s = 0; s < selection.count() && !isStop; s++) {
			if (isStop) { continue; }

			for (var platform in platforms) {
				if (!config[platform].length) { continue; }

				config.nestedFolder = (config.android.length && config.ios.length) ? platforms[platform] + "/" : "";

					JJ.assetExporter._exportLayer(selection[s], platform, config, context);
				
			}
		}
		isSuccess &= !isStop;

		return isSuccess;
	},

	_exportLayer: function(selection, platform, config, context) {
		var slices,
			sizeData,
			exportOption,
			fileName;
			
		var rect = selection.absoluteRect().rect();
			
		for (var i in config[platform]) {
			sizeData = config[platform][i];
			sizeData = requiredResolutions[platform][sizeData];

			selection.exportOptions().removeAllExportFormats();
			exportOption = selection.exportOptions().addExportFormat();
			exportOption.setName("");
			exportOption.setScale(sizeData.size);
			
			slices = MSExportRequest.exportRequestsFromExportableLayer(selection);
			slices[0].rect = rect;

			JJ.assetExporter._saveSliceToFile(slices[0], selection, platform, sizeData, config, context);
		}
		selection.exportOptions().removeAllExportFormats();
	},

	_saveSliceToFile: function(slice, selection, platform, sizeData, config, context) {
		var fileName;

		if (platform != "android") {
			fileName = (config.nestedFolder || "") + selection.name() + sizeData.name + ".png";
		} else {
			fileName = (config.nestedFolder || "") + "drawable-" + sizeData.name + "/" + selection.name() + ".png";
		}

		context.document.saveArtboardOrSlice_toFile(slice, (config.directory + fileName));
	}
};

JJ.exportConfig = {
	get: function(context) {
		var config,
			exportDirectory;
			requiredResolutions = {
				"android": [{size: 1,name: "mdpi"},{size: 1.5,name: "hdpi"},{size: 2,name: "xhdpi"},{size: 3,name: "xxhdpi"},{size: 4,name: "xxxhdpi"}],
				"ios": [{size: 1,name: ""},{size: 2,name: "@2x"},{size: 3,name: "@3x"}]};
			config = {"android":[],"ios":[]};

			for (var i=0 in requiredResolutions.android) {
				config.android.push(parseInt(i, 10));
			}
			for (var i=0 in requiredResolutions.ios) {
				config.ios.push(parseInt(i, 10));
			}

		if (!config) { return; }
		exportDirectory = JJ.UI.requestDirectory(context);
		if (!exportDirectory) { return; }
		config.directory = exportDirectory + "/";

		return config;
	}
};

JJ.UI = {
	requestDirectory: function(context) {
		var panel = NSOpenPanel.openPanel(),
			defaultPath,
			path;

		if (context.document.fileURL()) {
			defaultPath = context.document.fileURL().URLByDeletingLastPathComponent();
		} else {
			defaultPath = NSURL.URLWithString("~/Desktop");
		}

		panel.setDirectoryURL(defaultPath);
		panel.setCanChooseDirectories(true);
		panel.setAllowsMultipleSelection(false);
		panel.setMessage("Choose a destination location");
		panel.canCreateDirectories = true;

		if (panel.runModal() == NSOKButton) {
			path = panel.URL().path();
		}

		return path;
	}
};