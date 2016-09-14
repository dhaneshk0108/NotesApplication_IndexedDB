(function($) {

	var database_name = "jjoe1NotesDB";
	var database_version = 1;
	var database;

	function initializeDB(callback_success, callback_error) {
		database = indexedDB.open(database_name, database_version);

		database.onerror = function(event) {
			database = null;
			console.log("Error Opening DB: " + event.target.error.name);
			callback_error("Error Opening DB: " + event.target.error.name);
		};

		database.onupgradeneeded = function(event) {
			var db = event.target.result;
			if(!db.objectStoreNames.contains("note")) {
				db.createObjectStore("note", {keyPath: "id", autoIncrement: true });
			}
		};

		database.onsuccess = function(event) {
			database = event.target.result;
			callback_success();
		};
	}

	function addNote(note, callback_success, callback_error) {
		if(database == null) {
			callback_error("DB not initialized");
			return;
		}
		var transaction = database.transaction(["note"],"readwrite");
		var store = transaction.objectStore("note");
		var request = store.add(note);
		
		request.onerror = function(event) {
			console.log("Error Saving Note: ",event.target.error.name);
			callback_error("Error Saving Note: ",event.target.error.name);
		};
		
		request.onsuccess = function(event) {
			callback_success();
		};
	}

	function deleteNote(id, callback_success, callback_error) {
		if(database == null) {
			callback_error("DB not initialized");
			return;
		}
		var transaction = database.transaction(["note"], "readwrite");
		var store = transaction.objectStore("note");
		var request = store.delete(id);		
		
		request.onerror = function(event) {
			console.log("Error Deleting Note: ",event.target.error.name);
			callback_error("Error Deleting Note: ",event.target.error.name);
		};
		
		request.onsuccess = function(event){
			callback_success();
		};
	}

	function getNote(id, callback_success, callback_error) {
		if(database == null) {
			callback_error("DB not initialized");
			return;
		}
		var transaction = database.transaction(["note"], "readonly");
		var store = transaction.objectStore("note");
		var request = store.get(id);
		
		request.onerror = function(event) {
			console.log("Error Fetching Note: ",event.target.error.name);
			callback_error("Error Fetching Note: ",event.target.error.name);
		};
		
		request.onsuccess = function(event) {
			callback_success(request.result)
		};
	}

	function getNotesCount(callback_success, callback_error) {
		if(database == null) {
			callback_error("DB not initialized");
			return;
		}
		var transaction = database.transaction(["note"], "readonly");
		var store = transaction.objectStore("note");
		var request = store.count();		
		
		request.onerror = function(event) {
			console.log("Error Fetching Count: ",event.target.error.name);
			callback_error("Error Fetching Count: ",event.target.error.name);
		};

		request.onsuccess = function() {
			callback_success(request.result);
		};
	}

	function getAllNotes(callback_success, callback_error) {
		if(database == null) {
			callback_error("DB not initialized");
			return;
		}
		var transaction = database.transaction(["note"], "readonly");
		var store = transaction.objectStore("note");
		var request = store.openCursor();
		var notes = [];

		request.onerror = function(event) {
			console.log("Error Fetching Notes: ",event.target.error.name);
			callback_error("Error Fetching Notes: ",event.target.error.name);
		};

		request.onsuccess = function(event) {
			var cursor = event.target.result;
			if(cursor) {
				notes.push(cursor.value);
				cursor.continue();
			} else {
				callback_success(notes);
			}
		};
	}

	function Note(name, subject, message, created_at) {
		this.name = name;
		this.subject = subject;
		this.message = message;
		this.created_at = created_at;
	}

	//Method to list the notes
	function populateNotes() {
		getNotesCount(
			function(count){
				$("#notes-count").text(count);
			}, 
			showError
		);
		getAllNotes(
			function(notes){
				$("#notes-list").empty();
				if(notes.length < 1) {
					$('#notes-list').append($("<h4>").append($("<small>").append("No notes yet")));
					return;
				}
				for (var i = 0; i < notes.length; i++) {
					$listitem = $("<li>").addClass("list-group-item").addClass("note-item");
					var $row = $("<div>").addClass("row");
					var $id = $("<input>").attr("type", "hidden").attr("value", notes[i].id);
					var $sub = $("<div>").addClass("col-sm-7").addClass("note-item-subject").attr("data-toggle", "tooltip").attr("title","Subject").append(notes[i].subject);
					var $cnt = $("<div>").addClass("col-sm-1").attr("data-toggle", "tooltip").attr("title","Characters in message").append(notes[i].message.length);
					var $dtm = $("<div>").addClass("col-sm-3").addClass("note-item-created").attr("data-toggle", "tooltip").attr("title","Created at").append(displayDate(notes[i].created_at));
					var $dlt = $("<span>").addClass("col-sm-1").addClass("glyphicon").addClass("glyphicon-trash").addClass("note-item-delete").attr("data-toggle", "tooltip").attr("title","Delete Note");
					$row.append($id);
					$row.append($sub);
					$row.append($cnt);
					$row.append($dtm);
					$row.append($dlt);
					$listitem.append($row);
					$('#notes-list').append($listitem);
				}
			}, 
			showError
		);
	}

	function populateDetailView(node) {
		$("#detail-id").val(node.id);
		$("#detail-name").val(node.name);
		$("#detail-subject").val(node.subject);
		$("#detail-message").val(node.message);
		$("#detail-created_at").val(displayDate(node.created_at));
		$("#view-note").modal("show");
	}

	//Method to Print Date Time in desired format
	function displayDate(date) {
		var d = new Date(date);
		return((d.getMonth() + 1) + "/" + (d.getDate() + 1) + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds());
	}

	function showCreationSuccess() {
		passive_alert("success", "Note Created Successfully");
	}

	function showError(message) {
		passive_alert("error", message);
	}

	function showDeletionSuccess() {
		passive_alert("success", "Note Deleted Successfully");
	}

	//Method to validate input fields in form
	function validate($element) {
		var value = $element.text() || $element.val();
		if(value.trim().length < 1) {
			var $parent = $element.parent(0);
			$parent.addClass("has-error");
			$parent.focus();
			return false;
		}
		return($("<div>").html(value).text());
	}

	//Method to clear data and errors from new note
	function resetForm() {
		$("#name").val("");
		$("#subject").val("");
		$("#message").val("");
		clearFormErrors();
	}

	//Method to clear error from new note
	function clearFormErrors() {
		$("#name").parent(0).removeClass("has-error");
		$("#subject").parent(0).removeClass("has-error");
		$("#message").parent(0).removeClass("has-error");
	}

	function passive_alert(type, message) {
		var mode = "";
		if(message.length < 1) {
			return
		}
		if(type == "success") {
			mode = "success";
		} else if(type == "error") {
			mode = "danger";
		} else {
			mode = "info";
		}
		$div = $("<div>").addClass("alert fade in").addClass("alert-" + mode)
		$close = $("<a>").attr("href", "#").addClass("close").attr("data-dismiss", "alert").attr("aria-label", "close");
		$close.append($("<span>").addClass("glyphicon glyphicon-remove-circle"));
		$msg = $("<span>").append(message);
		$div.append($close);
		$div.append($msg);
		$("#notifications").append($div);
		setTimeout(function(){ $(".alert").alert("close"); }, 5000);
	}

	$(document).ready(function() {
		//Initializa the indexdb object
		initializeDB(populateNotes, showError);

		//To display tooltips
		$("[data-toggle='tooltip']").tooltip();

		//Clear previous data from new note modal
		$("#create-note").on('show.bs.modal', function () {
			resetForm();
		});

		//To save a new note
		$("#save-note").click(function() {
			clearFormErrors();
			var name = validate($("#name"));
			if(name == false) {
				return;
			}
			var subject = validate($("#subject"));
			if(subject == false) {
				return;
			}
			var message = validate($("#message"));
			if(message == false) {
				return;
			}
			var newNote = new Note(name, subject, message, $.now());
			addNote(newNote, showCreationSuccess, showError);
			$("#create-note").modal("hide");
			populateNotes();
		});

		//To delete a note
		$("#delete-note").click(function() {
			var id = parseInt($("#detail-id").val());
			deleteNote(id, showDeletionSuccess, showError);
			$("#view-note").modal("hide");
			populateNotes();
		});

		$(document).on("click", ".note-item-delete", function() {
			var id = parseInt($($(this).siblings("input")[0]).val());
			deleteNote(id, showDeletionSuccess, showError);
			populateNotes();
		});

		$(document).on("click", ".note-item-subject", function() {
			var id = parseInt($($(this).siblings("input")[0]).val());
			getNote(id, populateDetailView, showError);
		});
	});
	
})(jQuery);