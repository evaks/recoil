goog.provide('recoil.types');
goog.provide('recoil.types.IPAddress');
goog.provide('recoil.types.IPAddressType');
/**
 * @typedef {Array<number>}
 */
recoil.types.IPv4Address;

/**
 * @typedef {Array<number>}
 */
recoil.types.IPv6Address;

/**
 * @typedef {{type:string, value:!Array<number>}}
 */
recoil.types.IPAddress;

/**
 * the possible ip type
 * @enum {string}
 */
recoil.types.IPAddressType = {
    ipv6: 'ipv6-address',
    ipv4: 'ipv4-address'
};

