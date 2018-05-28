//META{"name":"VIPs"}*//
var VIPs = function() {
    "use strict";
    var getOwnerInstance, getInternalInstance, ReactDOM, React, WebpackModules, UserStore, StatusStore, FriendsStore, MemberStore, GuildsStore, Friends, originalFriendsRender, originalFriendsUpdate, userModal;

    getOwnerInstance = function(n){
        return getInternalInstance(n).return.return.stateNode;
    }

    return class VIPs {
        getName() { return "VIPs"; }
        getDescription() { return "Adds an extra section to the friends list where you can add your most important contacts on Discord (Bots included)."; }
        getVersion() { return "1.0.0"; }
        getAuthor() { return "Green"; }

        load() {
            getInternalInstance = BDV2.reactDom.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactDOMComponentTree.getInstanceFromNode;
            ({
                reactDom: ReactDOM,
                react: React,
                WebpackModules
            } = BDV2);
        }

        unload() {}

        start() {
            var libraryScript = document.getElementById('zeresLibraryScript');
            if (libraryScript) libraryScript.parentElement.removeChild(libraryScript);
            libraryScript = document.createElement("script");
            libraryScript.setAttribute("type", "text/javascript");
            libraryScript.setAttribute("src", "https://rauenzi.github.io/BetterDiscordAddons/Plugins/PluginLibrary.js");
            libraryScript.setAttribute("id", "zeresLibraryScript");
            document.head.appendChild(libraryScript);
            if (typeof window.ZeresLibrary !== "undefined") this.initialize();
            else libraryScript.addEventListener("load", () => { this.initialize(); });
        }


        initialize() {
            this.initialized = true;
            UserStore = WebpackModules.findByUniqueProperties(["getCurrentUser"]);
            StatusStore = BDV2.WebpackModules.findByUniqueProperties(["getStatus", "getStatuses"])
            FriendsStore = WebpackModules.findByUniqueProperties(["isFriend"]);
            MemberStore = WebpackModules.findByUniqueProperties(["getMembers"]);
            GuildsStore = WebpackModules.findByUniqueProperties(["getGuild"]);
            PluginUtilities.checkForUpdate(this.getName(), this.getVersion());
            Friends = WebpackModules.find(module => module.displayName === "Friends" && module.prototype.render);
            originalFriendsRender = Friends.prototype.render;
            originalFriendsUpdate = Friends.prototype.componentDidUpdate;

            Friends.prototype.render = function() {
                let user;
                let data = PluginUtilities.loadData("VIPs", "VIPs", "");
                if(data.ids){
                    if(data.ids.length > 0){
                        data.ids.forEach((id) => {
                            if((this.state.rows._rows[0]) && (user = UserStore.getUser(id))){
                                let mutualGuilds = [];
                                Object.values(GuildsStore.getGuilds()).forEach((guild) => {
                                    if(MemberStore.isMember(guild.id, id)){ mutualGuilds.push(guild); }
                                })
                                let objectRow = new (this.state.rows._rows[0].constructor)({
                                    activity: StatusStore.getActivity(id),
                                    key: id,
                                    mutualGuilds: mutualGuilds,
                                    mutualGuildsLength: mutualGuilds.length,
                                    status: StatusStore.getStatus(id),
                                    type: 99,
                                    user: user,
                                    usernameLower: user.usernameLowerCase
                                });
                                let found = this.state.rows._rows.some((row) => row.key == objectRow.key && row.type == objectRow.type);
                                if(!found){ this.state.rows._rows.push(objectRow); }
                                this.state.rows._rows.forEach((row) => {
                                    if(!(data.ids.some((id) => (row.type == 99 && row.key == id)) || (row.type != 99))){
                                        let index = this.state.rows._rows.indexOf(row);
                                        if (index > -1) { this.state.rows._rows.splice(index, 1); }
                                    }
                                });
                            }
                        });
                    } else {
                        this.state.rows._rows.forEach((row) => {
                            if(row.type == 99){
                                let index = this.state.rows._rows.indexOf(row);
                                if (index > -1) { this.state.rows._rows.splice(index, 1); }
                            }
                        });
                    }
                }
                
                let returnOriginal = originalFriendsRender.call(this);
                let sections = returnOriginal.props.children[0].props.children.props.children;
                sections.push(sections[sections.length-2]);
                sections.push(React.cloneElement(sections[sections.length-2], {"children": "VIP"}));
                sections[sections.length-1].key = "VIP";
   
                let VIPs = [];
                this.state.rows._rows.forEach((row) => {
                    if(row.type == 99){ VIPs.push(row); }
                });

                try{
                    if(this.state.section == "VIP"){
                        let Row = returnOriginal.props.children[1].props.children[1].props.children.props.children[0].type;
                        if(!Row) { return };
                        returnOriginal.props.children[1].props.children[1].props.children.props.children = VIPs.map(vip=>{
                            return React.createElement(Row, Object.assign({}, vip));
                        });
                    }
                } catch(e){
                    console.error(e);
                } finally{
                    return returnOriginal;
                }
            };

            Friends.prototype.componentDidUpdate = function() {
                let vipRowNumber = 0;
                if(this.state.section == "VIP"){
                    this.state.rows._rows.forEach((row) => {
                        if(row.type == 99){
                            let additionalActions = document.querySelectorAll(".friends-column-actions-visible")[vipRowNumber];
                            let wrapper = document.createElement('div');
                            wrapper.innerHTML = `<div class="VIP" style="-webkit-mask-image: url('https://cdn.iconscout.com/public/images/icon/free/png-24/star-bookmark-favorite-shape-rank-like-378019f0b9f54bcf-24x24.png'); cursor: pointer; height: 24px; margin-left: 8px; width: 24px; background-color: #fff;"></div>`;
                            if(additionalActions && additionalActions.childNodes.length == 0){
                                additionalActions.appendChild(wrapper.firstChild);
                            }
                            let vip = additionalActions.querySelector(".VIP");
                            if(vip){
                                let data = PluginUtilities.loadData("VIPs", "VIPs", "");
                                let id = row.user.id;
                                let ids = data.ids ? data.ids.slice(0) : [];
                                if(ids.indexOf(id) >= 0){
                                        vip.classList.add("selected");
                                        vip.style.backgroundColor = "#fac02e";
                                }
                                if(userModal && document.querySelectorAll(".friends-column-actions-visible").length != 1){
                                    if(document.querySelectorAll(".friends-column-actions-visible").length-2 == vipRowNumber){ userModal = false; }
                                } else{
                                    vip.addEventListener("click", function(e) {
                                        e.stopPropagation();
                                        data = PluginUtilities.loadData("VIPs", "VIPs", "");
                                        ids = data.ids ? data.ids.slice(0) : [];
                                        if(vip.classList.contains("selected")) {
                                            if(ids.indexOf(id) >= 0){ ids.splice(ids.indexOf(id), 1); }
                                            vip.classList.remove("selected");
                                            vip.style.backgroundColor = "#fff";
                                        } else {
                                            if(ids.indexOf(id) < 0){ ids.push(id); }
                                            vip.classList.add("selected");
                                            vip.style.backgroundColor = "#fac02e";
                                        }
                                        PluginUtilities.saveData("VIPs", "VIPs", {ids});
                                    });
                                }
                            }
                            vipRowNumber++;
                        }
                    })
                }
            }

            if(document.querySelector(".friends-table")){ getOwnerInstance(document.querySelector(".friends-table")).forceUpdate(); }

            PluginUtilities.showToast(this.getName() + " " + this.getVersion() + " has started.");
        }

       observer(e) {
            if(e.addedNodes.length && e.addedNodes[0].classList && e.addedNodes[0].classList.contains("modal-1UGdnR")){                     
                let popout = document.querySelector(".noWrap-3jynv6.root-SR8cQa");
                let actions = document.querySelector(".additionalActionsIcon-1FoUlE");
                if(popout && actions){
                    let data = PluginUtilities.loadData("VIPs", "VIPs", "");
                    let id = getOwnerInstance(popout).props.user.id;
                    let ids = data.ids ? data.ids.slice(0) : [];
                    let wrapper = document.createElement('div');
                    wrapper.innerHTML = `<div class="VIP" style="-webkit-mask-image: url('https://cdn.iconscout.com/public/images/icon/free/png-24/star-bookmark-favorite-shape-rank-like-378019f0b9f54bcf-24x24.png'); cursor: pointer; height: 24px; margin-left: 8px; width: 24px; background-color: #fff;"></div>`;
                    DOMUtilities.insertAfter(wrapper.firstChild, actions);
                    let vip = popout.querySelector(".VIP");
                    if(vip){
                        if(ids.indexOf(id) >= 0){
                            vip.classList.add("selected");
                            vip.style.backgroundColor = "#fac02e";
                        }
                        vip.addEventListener("click", function() {
                            if(vip.classList.contains("selected")) {
                                if(ids.indexOf(id) >= 0){ ids.splice(ids.indexOf(id), 1); }
                                PluginUtilities.saveData("VIPs", "VIPs", {ids});
                                vip.classList.remove("selected");
                                vip.style.backgroundColor = "#fff";
                            } else {
                                if(ids.indexOf(id) < 0){ ids.push(id); }
                                PluginUtilities.saveData("VIPs", "VIPs", {ids});
                                vip.classList.add("selected");
                                vip.style.backgroundColor = "#fac02e";
                            }
                            if(document.querySelector(".friends-table") && (userModal = true)){
                                getOwnerInstance(document.querySelector(".friends-table")).forceUpdate();
                                userModal = false;
                            }
                        });
                    }
                }
            }
        }

        stop() {
            originalFriendsRender && (Friends.prototype.render = originalFriendsRender);
            originalFriendsUpdate && (Friends.prototype.componentDidUpdate = originalFriendsUpdate);
            originalFriendsRender = null;
            originalFriendsUpdate = null;
        }

    }
}();
