//META{"name":"VIPs"}*//
var VIPs = function() {
    "use strict";
    var userModal;

    return class VIPs {
        getName() { return "VIPs"; }
        getDescription() { return "Adds an extra section to the friends list where you can add your most important contacts on Discord (Bots included). Add users by right clicking their name, opening their profile and then clicking on the star."; }
        getVersion() { return "1.3.2"; }
        getAuthor() { return "Green"; }
        getUpdateLink() { return "https://raw.githubusercontent.com/Greentwilight/VIPs/master/VIPs.plugin.js"; }
        load() {}

        constructor() {
            this.defaultSettings = {GroupDMs: true, VIPPinDMs: true};
            this.settings = this.defaultSettings;
        }
        
        generateSettings(panel) {
            ZLibrary.PluginUtilities.loadSettings(this.getName(), this.defaultSettings);
            new PluginSettings.ControlGroup("VIP Settings", () => {ZLibrary.PluginUtilities.saveSettings(this.getName(), this.settings);}, {shown: true}).appendTo(panel).append(
                new PluginSettings.Checkbox("Pin VIPs to DMs", "", this.settings.VIPPinDMs, (checked) => {this.settings.VIPPinDMs = checked;}),
                new PluginSettings.Checkbox("Include Group DMs", "", this.settings.GroupDMs, (checked) => {this.settings.GroupDMs = checked;})
            );
        }

        getSettingsPanel() {
            var panel = document.createElement("form")
            panel.setAttribute("class", "form");
            panel.setAttribute("width", "100%");
            if (this.initialized) this.generateSettings(panel);
		    return panel;
        }

        start() {	
            var libraryScript = document.getElementById('zeresLibraryScript');
            if (libraryScript) libraryScript.parentElement.removeChild(libraryScript);
            libraryScript = document.createElement("script");
            libraryScript.setAttribute("type", "text/javascript");
            libraryScript.setAttribute("src", "https://rauenzi.github.io/BDPluginLibrary/release/ZLibrary.js");
            libraryScript.setAttribute("id", "zeresLibraryScript");
            document.head.appendChild(libraryScript);
            if (typeof window.ZeresLibrary !== "undefined") this.initialize();
            else libraryScript.addEventListener("load", () => { this.initialize(); });
        }


        initialize() {
            let self = this, VIPIndex = -1, DMIndex = -1;
            self.initialized = true;           
            ZLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), this.getUpdateLink());
            const Friends = ZLibrary.WebpackModules.findByDisplayName("Friends");
            const DirectMessages = ZLibrary.WebpackModules.findByDisplayName("LazyScroller");

            Patcher.before(this.getName(), DirectMessages.prototype, "render", function(thisObject, args, returnValue){
                ZLibrary.PluginUtilities.loadSettings(self.getName(), self.defaultSettings);
                let ids = Object.values(PluginUtilities.loadData("VIPs", "VIPs", "").ids);
                if(self.settings.VIPPinDMs){
                    for (var index = 0; index < thisObject.props.children.length; index++){
                        let child = thisObject.props.children[index];
                        if(child && ids && ids.length > 0){
                            if(child.type == "header" && !(child.key == "activity-button" || child.key == "VIPs") && thisObject.props.children[index-1].key != "VIPs"){
                                if(VIPIndex == index || VIPIndex == -1){
                                    let VIPSection = DiscordModules.React.cloneElement(child);
                                    VIPIndex = index;
                                    VIPSection.key = "VIPs";
                                    VIPSection.props.children = "VIPs";
                                    thisObject.props.children.splice(index, 0, VIPSection);
                                    DMIndex = index + 1;
                                }
                            }
                            if(child.props.channel){
                                for (var idCounter = 0; idCounter < ids.length; idCounter++){
                                    let id = ids[idCounter];
                                    if(index > DMIndex && child.props.channel.recipients){
                                        if(self.settings.GroupDMs){
                                            if(index > DMIndex && child.props.channel.recipients[0] == id){
                                                if(self.settings.GroupDMs){
                                                    thisObject.props.children.splice(DMIndex, 0, thisObject.props.children.splice(index, 1)[0]);
                                                    DMIndex += 1;
                                                }
                                            }
                                        } else {
                                            if(child.props.channel.recipients[0] == id && child.props.channel.type == 1){
                                                thisObject.props.children.splice(DMIndex, 0, thisObject.props.children.splice(index, 1)[0]);
                                                DMIndex += 1;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });


            Patcher.after(this.getName(), Friends.prototype, "render", function(thisObject, args, returnValue) {
                let user, ids = Object.values(ZLibrary.PluginUtilities.loadData("VIPs", "VIPs", "").ids);
                if(ids){
                    if(ids.length > 0){
                        for (var idCounter = 0; idCounter < ids.length; idCounter++){
                            let id = ids[idCounter];
                            if((thisObject.state.rows._rows[0]) && (user = DiscordModules.UserStore.getUser(id))){
                                let mutualGuilds = [];
                                for (var guildCounter = 0; guildCounter < Object.values(DiscordModules.GuildStore.getGuilds()).length; guildCounter++){
                                    let guild = Object.values(DiscordModules.GuildStore.getGuilds())[guildCounter];
                                    if(DiscordModules.GuildMemberStore.isMember(guild.id, id)){ mutualGuilds.push(guild); }
                                }
                                let objectRow = new (thisObject.state.rows._rows[0].constructor)({
                                    activity: DiscordModules.UserActivityStore.getActivity(id),
                                    key: id,
                                    mutualGuilds: mutualGuilds,
                                    mutualGuildsLength: mutualGuilds.length,
                                    status: ZLibrary.DiscordModules.UserStatusStore.getStatus(id),
                                    type: 99,
                                    user: user,
                                    usernameLower: user.usernameLowerCase
                                });
                                let found = thisObject.state.rows._rows.some((row) => row.key == objectRow.key && row.type == objectRow.type);
                                if(!found){ thisObject.state.rows._rows.push(objectRow); }
                                for (var rowCounter = 0; rowCounter < thisObject.state.rows._rows.length; rowCounter++){
                                    let row = thisObject.state.rows._rows[rowCounter];
                                    if(!(ids.some((id) => (row.type == 99 && row.key == id)) || (row.type != 99))){
                                        let index = thisObject.state.rows._rows.indexOf(row);
                                        if (index > -1) { thisObject.state.rows._rows.splice(index, 1); }
                                    }
                                };
                            }
                        };
                    } else {
                        for (var rowCounter = 0; rowCounter < thisObject.state.rows._rows.length; rowCounter++){
                            let row = thisObject.state.rows._rows[rowCounter];
                            if(row.type == 99){
                                let index = thisObject.state.rows._rows.indexOf(row);
                                if (index > -1) { thisObject.state.rows._rows.splice(index, 1); }
                            }
                        };
                    }
                }
                
                let sections = returnValue.props.children[0].props.children.props.children, VIPs = [];
                sections.push(sections[sections.length-2]);
                sections.push(DiscordModules.React.cloneElement(sections[sections.length-2], {"children": "VIP"}));
                sections[sections.length-1].key = "VIP";
   
                for (var rowCounter = 0; rowCounter < thisObject.state.rows._rows.length; rowCounter++){
                    let row = thisObject.state.rows._rows[rowCounter];
                    if(row.type == 99){ VIPs.push(row); }
                };

                VIPs.sort(function(a,b) {return (a.usernameLower > b.usernameLower) ? 1 : ((b.usernameLower > a.usernameLower) ? -1 : 0);} );

                try{
                    if(thisObject.state.section == "VIP"){
                        if(returnValue.props.children[1].props.children[1].props.children.props){
                            var Row = returnValue.props.children[1].props.children[1].props.children.props.children[0].type
                        } else{
                            var Row = returnValue.props.children[1].props.children[1].props.children[0].type;
                        }
                        if(!Row) { return };
                        if(returnValue.props.children[1].props.children[1].props.children.props){
                            returnValue.props.children[1].props.children[1].props.children.props.children = VIPs.map(vip=>{
                                return DiscordModules.React.createElement(Row, Object.assign({}, vip));
                            });
                        } else {
                            returnValue.props.children[1].props.children[1].props.children = VIPs.map(vip=>{
                                return DiscordModules.React.createElement(Row, Object.assign({}, vip));
                            });
                        }
                    }
                } catch(e){
                    console.error(e);
                } finally{
                    return returnValue;
                }
            });

            Patcher.instead(this.getName(), Friends.prototype, "componentDidUpdate", function(thisObject) {
                let vipRowNumber = 0;
                if(thisObject.state.section == "VIP"){
                    for (var rowCounter = 0; rowCounter < thisObject.state.rows._rows.length; rowCounter++){
                        let row = thisObject.state.rows._rows[rowCounter];
                        if(row.type == 99){
                            let additionalActions = document.querySelectorAll(".friends-column-actions-visible")[vipRowNumber], wrapper = document.createElement('div');
                            wrapper.innerHTML = `<div class="VIP" style="-webkit-mask-image: url('https://i.imgur.com/Et8gpFg.png'); cursor: pointer; height: 24px; margin-left: 8px; width: 24px; background-color: #fff;"></div>`;
                            if(additionalActions && additionalActions.childNodes.length == 0){
                                additionalActions.appendChild(wrapper.firstChild);
                            }
                            let vip = additionalActions.querySelector(".VIP");
                            if(vip){
                                let ids = Object.values(ZLibrary.PluginUtilities.loadData("VIPs", "VIPs", "").ids), id = row.user.id;
                                if(ids.indexOf(id) >= 0){
                                    vip.classList.add("selected");
                                    vip.style.backgroundColor = "#fac02e";
                                }
                                if(userModal && document.querySelectorAll(".friends-column-actions-visible").length != 1){
                                    if(document.querySelectorAll(".friends-column-actions-visible").length-2 == vipRowNumber){ userModal = false; }
                                } else{
                                    vip.addEventListener("click", function(e) {
                                        e.stopPropagation();
                                        ids = Object.values(ZLibrary.PluginUtilities.loadData("VIPs", "VIPs", "").ids);
                                        if(vip.classList.contains("selected")) {
                                            if(ids.indexOf(id) >= 0){ ids.splice(ids.indexOf(id), 1); }
                                            vip.classList.remove("selected");
                                            vip.style.backgroundColor = "#fff";
                                        } else {
                                            if(ids.indexOf(id) < 0){ ids.push(id); }
                                            vip.classList.add("selected");
                                            vip.style.backgroundColor = "#fac02e";
                                        }
                                        ZLibrary.PluginUtilities.saveData("VIPs", "VIPs", {ids});
                                    });
                                }
                            }
                            vipRowNumber++;
                        }
                    }
                } else{
                    if(document.querySelector(".VIP")){
                        for(var VIPCounter = 0; VIPCounter < document.querySelectorAll(".VIP").length; VIPCounter++){
                            let VIPIcon = document.querySelectorAll(".VIP")[VIPCounter];
                            VIPIcon.remove();
                        }
                    }
                }
            });

            if(document.querySelector(".friends-table")){ ZLibrary.ReactTools.getOwnerInstance(document.querySelector(".friends-table")).forceUpdate(); }

            ZLibrary.Toasts.show(this.getName() + " " + this.getVersion() + " has started.");
        }

        onContextMenu(e) {
            let target = e.target, context = document.querySelector(".da-contextMenu");
            if(context){
                let ids = Object.values(ZLibrary.PluginUtilities.loadData("VIPs", "VIPs", "").ids);
                for(var contextGroupCounter = 0; contextGroupCounter < context.childNodes.length; contextGroupCounter++){
                    let contextMenuGroup = context.childNodes[contextGroupCounter];
                    for(var contextItemCounter = 0; contextItemCounter < contextMenuGroup.childNodes.length; contextItemCounter++){
                        let contextMenuItem = contextMenuGroup.childNodes[contextItemCounter];
                        let isFriend;
                        try{ isFriend = ZLibrary.ReactTools.getOwnerInstance(contextMenuItem); } catch(e) {};
                        if(contextMenuItem.textContent == "Show on Games Tab" && ((contextMenuItem.nextSibling.textContent != "Remove VIP") && (contextMenuItem.nextSibling.textContent != "Add VIP")) || isFriend && isFriend.handleBlock && !contextMenuItem.nextSibling){
                            let user = ZLibrary.ReactTools.getOwnerInstance(context).props.children.props.children.props.children[1].props.children[0].props.user, wrapper = document.createElement('div'), isVIP;                 
                            if(ids){ isVIP = ids.some((id) => id == user.id) }
                            let itemText = isVIP ? "Remove VIP" : "Add VIP";
                            wrapper.innerHTML = `<div id="VIPContext" class="item-1Yvehc"><span>` + itemText + `</span></div>`;
                            contextMenuGroup.insertBefore(wrapper.firstChild, contextMenuItem.nextSibling);
                            document.getElementById("VIPContext").onclick = function(){ 
                                let id = user.id;
                                if(this.textContent == "Remove VIP"){
                                    if(ids.indexOf(id) >= 0){ ids.splice(ids.indexOf(id), 1); }
                                    this.textContent = "Add VIP";
                                } else {
                                    if(ids.indexOf(id) < 0){ ids.push(id); }
                                    this.textContent = "Remove VIP";
                                }
                                ZLibrary.PluginUtilities.saveData("VIPs", "VIPs", {ids});
                                if(document.querySelector(".friends-table")){ ZLibrary.ReactTools.getOwnerInstance(document.querySelector(".friends-table")).forceUpdate(); }
                                }
                        }
                    };
                };
            }
        }

       observer(e) {
            if(e.addedNodes.length && e.addedNodes[0].classList && e.addedNodes[0].classList.contains("da-contextMenu")){ this.onContextMenu(e); }

            if(e.addedNodes.length && e.addedNodes[0].classList && e.addedNodes[0].classList.contains("modal-1UGdnR")){                     
                let popout = document.querySelector(".inner-1JeGVc").childNodes[0], actions = document.querySelector(".additionalActionsIcon-1FoUlE");
                if(popout && actions){
                    let ids = Object.values(ZLibrary.PluginUtilities.loadData("VIPs", "VIPs", "").ids), id = ZLibrary.ReactTools.getOwnerInstance(document.querySelector(".da-modal")).props.children.props.children.props.user.id,
                    wrapper = document.createElement('div');
                    wrapper.innerHTML = `<div class="VIP" style="-webkit-mask-image: url('https://i.imgur.com/Et8gpFg.png'); cursor: pointer; height: 24px; margin-left: 8px; width: 24px; background-color: #fff;"></div>`;
                    ZLibrary.DOMTools.insertAfter(wrapper.firstChild, actions.parentNode);
                    let vip = popout.querySelector(".VIP");
                    if(vip){
                        if(ids.indexOf(id) >= 0){
                            vip.classList.add("selected");
                            vip.style.backgroundColor = "#fac02e";
                        }
                        vip.addEventListener("click", function() {
                            if(vip.classList.contains("selected")) {
                                if(ids.indexOf(id) >= 0){ ids.splice(ids.indexOf(id), 1); }
                                ZLibrary.PluginUtilities.saveData("VIPs", "VIPs", {ids});
                                vip.classList.remove("selected");
                                vip.style.backgroundColor = "#fff";
                            } else {
                                if(ids.indexOf(id) < 0){ ids.push(id); }
                                ZLibrary.PluginUtilities.saveData("VIPs", "VIPs", {ids});
                                vip.classList.add("selected");
                                vip.style.backgroundColor = "#fac02e";
                            }
                            if(document.querySelector(".friends-table") && (userModal = true)){
                                ZLibrary.ReactTools.getOwnerInstance(document.querySelector(".friends-table")).forceUpdate();
                                userModal = false;
                            }
                        });
                    }
                }
            }
        }

        stop() {
            Patcher.unpatchAll(this.getName());
        }

    }
}();
