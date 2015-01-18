'use strict';

angular.module("mopify.account.services.spotify", [
    "spotify",
    'mopify.services.servicemanager',
    "mopify.services.spotifylogin",
    "mopify.services.settings",
    "mopify.services.mopidy",
    "toggle-switch",
    "llNotifier"
])

.config(function($routeProvider) {
    $routeProvider.when("/account/services/spotify", {
        templateUrl: "account/services/spotify/spotify.tmpl.html",
        controller: "SpotifyServiceController"
    }); 
})


.controller("SpotifyServiceController", function SpotifyServiceController($scope, $location, ServiceManager, Settings, Spotify, SpotifyLogin, mopidyservice, notifier){
    if(!ServiceManager.isEnabled("spotify")){
        $location.path("/account/services");
        return;
    }

    // Bind settings to the scope
    Settings.bind($scope);

    // Get current user
    Spotify.getCurrentUser().then(function(data){
        $scope.profile = data;
    });

    /**
     * Get a setting from the given string by key
     * @param  {String} key  the key to get the value from
     * @param  {String} data the complete settings string
     * @return {String}      the setting's value
     */
    function getSetting(key, data){
        var regex = new RegExp("('" + key + "': )(.[^,]+)", "g");
        var test = regex.exec(data);
        return test[2];
    }

    /**
     * Get Mopidy's settings
     */
    mopidyservice.getSettings().then(function(data){
        if($scope.settings.mopidy === undefined)
            $scope.settings.mopidy = {};

        $scope.settings.mopidy.spotify_username = getSetting("spotify_username", data);
        $scope.settings.mopidy.spotify_password = getSetting("spotify_password", data);
    });

    /**
     * Handler that will be called after the settings switch has switched
     * This will reset the Spotify credentials and use the credentials provided by the mopidy config file
     */
    $scope.switchSettingsSource = function(){
        if($scope.settings.spotify.usegeneral === true){
            if($scope.settings.mopidy.spotify_username != 'None' && $scope.settings.mopidy.spotify_password != 'None'){
                SpotifyLogin.reauth();
            }
            else{
                notifier.notify({type: "custom", template: "Please add spotify_username and spotify_password to your Mopidy.conf file.", delay: 7500});
                $scope.settings.spotify.usegeneral = false;
            }
        }
    };

})

.controller("SpotifyMenuController", function SpotifyMenuController($q, $scope, Spotify, SpotifyLogin){

    // Set some scope vars
    $scope.userProfile = {};
    $scope.authorized = false;

    // Check if we are logged in
    SpotifyLogin.getLoginStatus().then(function(data){
        if(data.status == "connected"){
            collectdata();   
        }
        else{
            SpotifyLogin.login().then(function(){
                collectdata();
            });            
        }
    });

    // Get the user porfile from Spotify
    function collectdata(){
        // Make the call
        Spotify.getCurrentUser().then(function(data){
            $scope.authorized = true;
            $scope.userProfile = data;
        });
    }

    $scope.$on("mopify:services:disconnected", function(e, service){
        if(service.name == "Spotify"){
            SpotifyLogin.disconnect();
        }
    });
});