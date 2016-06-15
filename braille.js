	
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
    $.get("/braille-input/braille/languages.txt",parseData);
    
    //Connecting combobox handler
    $('#braillelanguage').change(function() {
		language = $(this).val().split('-')[0];
		load_language(language)
			
	});
	
	// The map used for transilation
	var map = {};
	
	//Contraction dict 
	var contractions_dict = {};
	
	//Abbreviations dict
	var abbreviations = {};
	
	//Simple Mode
	var simple_mode = 0;

	// 7 - Abbreviation key   8 - Captitol/Chill   9 - Letter Deletion 0 - Swich between lists
	var keycode_map = {70:"1",68:"2",83:"3",74:"4",75:"5",76:"6",65:"7",71:"8",72:"9",186:"0",59:"0"}
	
	var cur_language = "english";
	
	var braille_letter_map_pos = 0;
	load_language(cur_language);

	//Simple Mode Checkbox
	$('#isSimpleMode').click(function() {
		simple_mode = (this.checked);
		load_language(cur_language);
	});	
	
	
	function load_language(language){
		console.log("loading Map for language : %s" + language)
		cur_language = language;
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
		console.log(Object.keys(keycode_map),event.keyCode.toString());
		if($.inArray(event.keyCode.toString(),Object.keys(keycode_map)) >= 0)
		{
			items=items+keycode_map[event.keyCode];
			event.preventDefault();
		}
		
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
			
			
			if (items == "0")
			{
				braille_letter_map_pos = 2;
				event.preventDefault();
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
					if (abbreviations[last_word])
					{
						console.log(items,abbreviations[last_word]);						
						
						var left = textAreaTxt.slice(0,iCaretPos-(last_word.length));
						var right = textAreaTxt.slice(iCaretPos,(textAreaTxt.length));
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
					insertAtCaret("brailletextarea",map[items][braille_letter_map_pos])
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

