//Simple Mode
var simple_mode = 0;

var caps_lock = 0;

var language_no = 0;

var keycode_map;

	
$( document ).ready(function(){
	
	// Combobox Inetialization 
    function parseData(data){
        var lines = data.split("\n");
        var combo = document.getElementById("braillelanguage");
        for (var i = 0, len = lines.length; i < len; i++) {
            //save(lines[i]);
            //alert("data is: " + lines[i]);
            if (lines[i] != ""){
				var option = document.createElement("option");
				option.text = lines[i];
				option.value = lines[i];
        
				try {
					combo.add(option, null); //Standard 
				}catch(error) {
					combo.add(option); // IE only
				}
			}
		}
	}

    $.ajax({ url: "/braille-input/braille/languages.txt",
			success: parseData,
			async: false });


    
    //Connecting combobox handler
    $('#braillelanguage').change(function() {
		language = $(this).val().split('-')[0];
		load_language(language)
		language_no = $('option:selected',$(this)).index();
	});

	// 7 - Abbreviation key   8 - Captitol/Chill   9 - Letter Deletion 0 - punctuation -1 - Swich between lists
	keycode_map = $.jStorage.get("braille-input-tool-keycode-map");
	if(keycode_map == null)
		keycode_map = {"1":"70","2":"68","3":"83","4":"74","5":"75","6":"76","7":"65","8":"71","9":"72","0":"186","0":"59","-1":"18"};

	$("#configure_button").click(function(){
		$("#configure_table").show(100);
		$("#configure_button").hide(100);

		$.each(keycode_map, function(key, val){
			console.log("Value = "+val+"Key = "+key);
			$("#key"+key).val(keyboardMap[val]);
			$("#key"+key).keydown(function(event){
					if (keyboardMap[event.keyCode] == "TAB" || keyboardMap[event.keyCode] == "SHIFT" )
						return;
					event.preventDefault();
					console.log("This is from : "+val+" Pressed = "+keyboardMap[event.keyCode]+" Key code : "+event.keyCode);

					// Check the pressed key is same
					if (event.keyCode != keycode_map[key])
					{
								//Check the key is used by other
								var exist_flag = 0;
								$.each(keycode_map, function(key, val){
									if(val == event.keyCode){
										console.log("Other Exist");
										$(this).val("NONE");
										exist_flag = 1;
									}
								});

								if(exist_flag == 0){
									keycode_map[key] = event.keyCode;
									$(this).val(keyboardMap[event.keyCode]);
								}
					}
				});

			});



	});
	$("#close_button").click(function(){
		$("#configure_table").hide(100);
		$("#configure_button").show(100);
	});

	$("#reset_button").click(function(){
		keycode_map = {"1":"70","2":"68","3":"83","4":"74","5":"75","6":"76","7":"65","8":"71","9":"72","0":"186","0":"59","-1":"18"};
		$("#configure_table").hide(100);
		$("#configure_button").show(100);
	});

	$("#configure_table").hide();
	
	// The map used for transilation
	var map = {};
	
	//Contraction dict 
	var contractions_dict = {};
	
	//Abbreviations dict
	var abbreviations = {};
	
	simple_mode = $.jStorage.get("braille-input-tool-simple-mode");
	caps_lock = $.jStorage.get("braille-input-tool-caps-lock");
	language_no = $.jStorage.get("braille-input-tool-language");
	
	$('#isSimpleMode').prop('checked', simple_mode);
	$('#isCapsLock').prop('checked', caps_lock);
	
	if(language_no == null)
		language_no = 0;
	if(simple_mode == null)
		simple_mode = 0;
	if(caps_lock == null)
		caps_lock = 0;
		
	var braille_letter_map_pos = 0;
	
	$('#braillelanguage option')[language_no].selected = true;
	var language = $('#braillelanguage').val().split('-')[0];
	load_language(language)

	
	//Simple Mode Checkbox
	$('#isSimpleMode').click(function() {
		simple_mode = (this.checked);
		var language = $('#braillelanguage').val().split('-')[0];
		load_language(language)
	});	

	//Capital Mode Checkbox
	$('#isCapsLock').click(function() {
		caps_lock = (this.checked);
	});	
	
	
	function load_language(language){
		console.log("loading Map for language : %s" + language)
		map = {};
		contractions_dict = {};
		
		var submap_number = 1;
		append_sub_map("beginning.txt",submap_number,language);
		
		submap_number = 2;
		append_sub_map("middle.txt",submap_number,language);
		
		submap_number = 3;
		append_sub_map("punctuations.txt",submap_number,language);
		
		
		if (simple_mode == 0)
		{
			$.ajax({
			url: 'braille/'+language+"/contraction_map_list.txt",
			success: function (data) {
				var files = data.split("\n");
				for (var i = 0, len = files.length; i < len; i++) {
					if (files[i] != "" && simple_mode == 0){
						submap_number += 1;
						console.log("#########"+files[i].slice(0, -4));
						append_sub_map(files[i],submap_number,language);
						contractions_dict[files[i].slice(0, -4)] = submap_number-1;
					}			
				}
				
			}, async:false }); 
			
        
			//Load abbreviations if exist
			load_abbrivation(language);

			for(var key in abbreviations) {
				var value = map[key];
				console.log(key,value); 
			}
		}
        for(var key in map) {
			var value = map[key];
			console.log(key,value);
		}
	}


	function append_sub_map(filename,submap_number,language){
		console.log("Loading sub map file for : " +language+"/"+filename+"On submap : "+submap_number)
		jQuery.ajax({
		url : "/braille-input/braille/"+language+"/"+filename,
		success : function (data){
			var lines = data.split("\n");
			for (var i = 0, len = lines.length; i < len; i++) {
				//save(lines[i]);
				if (lines[i] != ""){					
					
					
					if ((lines[i].split(" ")[0]) in map)
					{
						map[lines[i].split(" ")[0]].push(lines[i].split(" ")[1]) // may be new line to be removed 
						if (map[lines[i].split(" ")[0]].length != submap_number)
							console.log("Repeated on : ",lines[i].split(" ")[0])
					}
					
					else{						
						var list = [];
						for (var j=1; j<submap_number; j++) {
							list.push(" ");
						}
						list.push(lines[i].split(" ")[1]); // may be new line to be removed
						map[lines[i].split(" ")[0]] = list;
						//console.log(lines[i].split(" ")[0]+map[lines[i].split(" ")[0]]);					
					}
					

				}
			}
		},
		async: false });
		
		
		//Fill blank if empty 
		for(var key in map) {
			var value = map[key];
			if(value.length < submap_number)
			{
				map[key].push("");
			}			 
		}
	}	
			

	function load_abbrivation(language){
		abbreviations = {}
		jQuery.ajax({
		url : "/braille-input/braille/"+language+"/abbreviations.txt",
		success : function (data){
			var lines = data.split("\n");
			for (var i = 0, len = lines.length; i < len; i++) {
				//save(lines[i]);
				if (lines[i] != ""){
					console.log(lines[i].split("  "));
					abbreviations[lines[i].split("  ")[0]] = lines[i].split("  ")[1]; }
				}
			}
		});
	}


	
	
	
    var items = "";
    $('#brailletextarea').keydown(function(event)
    {
		$.each(keycode_map, function(key, val){
			if(val == event.keyCode){
				items=items+key;
				event.preventDefault();
				}
		});
    });
    
    function insertAtCaret(areaId,text) {
		var txtarea = document.getElementById(areaId);
		var scrollPos = txtarea.scrollTop;
		var strPos = 0;
		var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? 
			"ff" : (document.selection ? "ie" : false ) );
		if (br == "ie") { 
			txtarea.focus();
			var range = document.selection.createRange();
			range.moveStart ('character', -txtarea.value.length);
			strPos = range.text.length;
		}
		else if (br == "ff") strPos = txtarea.selectionStart;

		var front = (txtarea.value).substring(0,strPos);  
		var back = (txtarea.value).substring(strPos,txtarea.value.length); 
		txtarea.value=front+text+back;
		strPos = strPos + text.length;
		if (br == "ie") { 
			txtarea.focus();
			var range = document.selection.createRange();
			range.moveStart ('character', -txtarea.value.length);
			range.moveStart ('character', strPos);
			range.moveEnd ('character', 0);
			range.select();
		}
		else if (br == "ff") {
			txtarea.selectionStart = strPos;
			txtarea.selectionEnd = strPos;
			txtarea.focus();
		}
		txtarea.scrollTop = scrollPos;
	}
    

    function getCursorPosition(areaId) {
        var input = document.getElementById(areaId);
        if (!input) return; // No (input) element found
        if ('selectionStart' in input) {
            // Standard-compliant browsers
            return input.selectionStart;
        } else if (document.selection) {
            // IE
            input.focus();
            var sel = document.selection.createRange();
            var selLen = document.selection.createRange().text.length;
            sel.moveStart('character', -input.value.length);
            return sel.text.length - selLen;
        }
    }


	function setCaretPosition(elemId, caretPos) {
		var elem = document.getElementById(elemId);

		if(elem != null) {
			if(elem.createTextRange) {
				var range = elem.createTextRange();
				range.move('character', caretPos);
				range.select();
			}
			else {
				if(elem.selectionStart) {
					elem.focus();
					elem.setSelectionRange(caretPos, caretPos);
				}
				else
					elem.focus();
			}
		}
	}    

    
    
    function case_insensitive_comp(strA, strB) 
    {
		return strA.toLowerCase().localeCompare(strB.toLowerCase());
    }

    $('#brailletextarea').keyup(function(event)
    {
		
		if(items != ""){
			items = items.split("");
			items = items.sort( case_insensitive_comp )
			items = items.join("");
			
			
			//Move map position to contraction if any
			if  ($.inArray( items, Object.keys(contractions_dict)) >= 0){
				braille_letter_map_pos = contractions_dict[items];
				console.log("Switching to map position "+ braille_letter_map_pos);
			}
			
			
			if (items == "-1")
			{
				if (braille_letter_map_pos != 0)
					braille_letter_map_pos = 0;
				else
					braille_letter_map_pos = 1;
				
				console.log(braille_letter_map_pos);
			}
			if (items == "0")
			{
				braille_letter_map_pos = 2;
				event.preventDefault();
			}
			
			if (items == "8")
			{
				console.log(!caps_lock);
				caps_lock = !caps_lock;
				$('#isCapsLock').prop('checked', caps_lock);
				
			}
			
			if(items == "9")
			{
				var textAreaTxt = $(this).val();
				var iCaretPos = getCursorPosition("brailletextarea");
				var left = textAreaTxt.slice(0,iCaretPos-1);
				var right = textAreaTxt.slice(iCaretPos,(textAreaTxt.length));
				$(this).val(left+right)
				setCaretPosition("brailletextarea",iCaretPos-1);
			}

			if(items == "89")
			{
				var textAreaTxt = $(this).val();
				var iCaretPos = getCursorPosition("brailletextarea");
				var words = textAreaTxt.slice(0,iCaretPos).split(" ");
				var last_word = words.slice(-1)[0];
				var left = textAreaTxt.slice(0,iCaretPos-(last_word.length));
				var right = textAreaTxt.slice(iCaretPos,(textAreaTxt.length));
				$(this).val(left+right)
				setCaretPosition("brailletextarea",iCaretPos-(last_word.length));
			}

			//Abbreviation expansion 
			if (items == "7" && simple_mode == 0)
			{
				try
				{
					var textAreaTxt = $(this).val();
					var iCaretPos = getCursorPosition("brailletextarea");
					var words = textAreaTxt.slice(0,iCaretPos).split(" ");
					var last_word = words.slice(-1)[0];
					
					console.log(abbreviations+last_word);
					if (abbreviations[last_word.toLowerCase()])
					{
						console.log(items,abbreviations[last_word]);						
						
						var left = textAreaTxt.slice(0,iCaretPos-(last_word.length));
						var right = textAreaTxt.slice(iCaretPos,(textAreaTxt.length));
						
						if(caps_lock)
							$(this).val(left+abbreviations[last_word.toLowerCase()].toUpperCase()+right)
						else
							$(this).val(left+abbreviations[last_word]+right)
						
						if(right.length > 0)
							setCaretPosition("brailletextarea",iCaretPos+(abbreviations[last_word].length-1));
						else
							setCaretPosition("brailletextarea",iCaretPos+(abbreviations[last_word].length));
						
						
						setCaretPosition
						braille_letter_map_pos = 1;
					}
				}catch(e)
				{
					console.log(e);

				}
			}
			
			
			try
			{
				if (map[items][braille_letter_map_pos])
				{
					console.log(items,map[items][braille_letter_map_pos]);
					if(caps_lock)
						insertAtCaret("brailletextarea",map[items][braille_letter_map_pos].toUpperCase());
					else
						insertAtCaret("brailletextarea",map[items][braille_letter_map_pos]);
					braille_letter_map_pos = 1;
				}
			}catch(e)
			{
				console.log(e);

			}
		}
		
		items="";
		
		// 32 - Space
		if(event.keyCode == 32){
			braille_letter_map_pos = 0;
		}
		//event.preventDefault();
    });
});


$( window ).unload(function(){
    $.jStorage.set("braille-input-tool-caps-lock",caps_lock);
    $.jStorage.set("braille-input-tool-simple-mode",simple_mode);
    $.jStorage.set("braille-input-tool-language",language_no);
    $.jStorage.set("braille-input-tool-keycode-map",keycode_map);
});

