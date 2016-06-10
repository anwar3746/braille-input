	
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

	// 7 - Abbreviation key   8 - Captitol/Chill   9 - Letter Deletion 0 - Swich between lists
	var keycode_map = {70:"1",68:"2",83:"3",74:"4",75:"5",76:"6",65:"7",71:"8",72:"9",186:"0"}
	
	var braille_letter_map_pos = 0;
	load_language("english");
	
	
	
	function load_language(language){
		console.log("loading Map for language : %s" + language)
		map = {};
		contractions_dict = {};
		
		var simple_mode = 0;
		
		var submap_number = 1;
		append_sub_map("beginning.txt",submap_number,language);
		
		submap_number = 2;
		append_sub_map("middle.txt",submap_number,language);
		
		submap_number = 3;
		append_sub_map("punctuations.txt",submap_number,language);
		





		$.ajax({
        //This will retrieve the contents of the folder if the folder is configured as 'browsable'
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
        
        
        for(var key in map) {
			var value = map[key];
			console.log(key,value); 
		}	
        
        //Load abbreviations if exist
		//######################load_abbrivation();
        
        
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
		for (var i=0; i<Object.keys(map).length; i++) {
			if ( map[i] )
			{
				if (Object.keys(map[i]).length < submap_number)
				{
					map[i].push("");
				}
			}
		}
	}	
			
			
		

/*

	function load_abbrivation(language):
		abbreviations = {}
		try:
			for line in open("%s/braille/%s/abbreviations.txt"%(data_dir,language),mode='r'):
				self.abbreviations[line.split("  ")[0]] = line.split("  ")[1][:-1]
		except FileNotFoundError:
			pass

*/


	
	
	
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
			
			try
			{
				if (map[items][braille_letter_map_pos])
				{
					console.log(items,map[items][braille_letter_map_pos]);
					$(this).val($(this).val()+map[items][braille_letter_map_pos]);
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

