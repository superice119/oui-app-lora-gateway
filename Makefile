#
# Copyright (C) 2024 superice119 <superice@163.com>
#
# This is free software, licensed under the MIT.
#

include $(TOPDIR)/rules.mk

APP_TITLE:=LoRa Gateway
APP_NAME:=lora-gateway

PKG_NAME:=$(APP_NAME)
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

# Use host node/npm; OUI SDK sets STAGING_DIR_HOSTPKG if node feed is installed.
# Prefer that, fall back to system PATH (works fine in GitHub Actions CI).
ifneq ($(wildcard $(STAGING_DIR_HOSTPKG)/bin/npm),)
  NPM := PATH=$(STAGING_DIR_HOSTPKG)/bin npm
else
  NPM := npm
endif

define Package/$(PKG_NAME)
  SECTION:=oui
  CATEGORY:=Oui
  SUBMENU:=Applications
  TITLE:=$(APP_TITLE)
  DEPENDS:=+oui-ui-core
  PKGARCH:=all
endef

define Package/$(PKG_NAME)/description
  LoRa Gateway management UI for OUI.
  Supports basicstation and lora_pkt_fwd with real-time status,
  service control and configuration.
endef

define Build/Prepare
	$(CP) ./htdoc $(PKG_BUILD_DIR)/
	echo "VITE_APP_NAME=$(APP_NAME)" > $(PKG_BUILD_DIR)/htdoc/.env.local
endef

define Build/Compile
	$(NPM) --prefix $(PKG_BUILD_DIR)/htdoc install --prefer-offline
	$(NPM) --prefix $(PKG_BUILD_DIR)/htdoc run build
endef

define Package/$(PKG_NAME)/install
	# Frontend dist (JS + CSS) → OUI views dir
	$(INSTALL_DIR) $(1)/www/views
	$(CP) $(PKG_BUILD_DIR)/htdoc/dist/$(APP_NAME).js  $(1)/www/views/
	$(CP) $(PKG_BUILD_DIR)/htdoc/dist/$(APP_NAME).css $(1)/www/views/

	# Menu registration
	$(INSTALL_DIR) $(1)/usr/share/oui/menu.d
	$(INSTALL_CONF) ./files/menu.json $(1)/usr/share/oui/menu.d/$(APP_NAME).json

	# Lua RPC backend
	$(INSTALL_DIR) $(1)/usr/share/oui/rpc
	$(CP) ./files/rpc/lora-gateway.lua $(1)/usr/share/oui/rpc/

	# Default UCI config
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/lora $(1)/etc/config/lora

	# lighttpd port override (8080 to avoid conflict with LuCI on :80)
	$(INSTALL_DIR) $(1)/etc/lighttpd/conf.d
	$(INSTALL_CONF) ./files/lighttpd/50-oui-port.conf $(1)/etc/lighttpd/conf.d/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))

