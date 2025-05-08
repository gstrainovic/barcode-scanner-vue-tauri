pub const STRAPI_URL: &str = "https://gz-strapi.strainovic-it.ch"; 
pub const VERSION : &str = "2.0.4";
pub const DIALOG_TITLE : &str = "BarcodeScanner Dialog";
// Use a function to return the formatted string, since format! returns a String, not &'static str
pub fn toast_title() -> String {
	format!("{} {}", DIALOG_TITLE, VERSION)
}