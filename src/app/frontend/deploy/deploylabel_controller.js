// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import DeployLabel from './deploylabel';

/**
 * Service used for handling label actions like: hover, showing duplicated key error, etc.
 * @final
 */
export default class DeployLabelController {
  /**
   * Constructs our label controller.
   */
  constructor() {
    /** @export {!DeployLabel} Initialized from the scope. */
    this.label;

    /** @export {!Array<!DeployLabel>} Initialized from the scope. */
    this.labels;
  }

  /**
   * Calls checks on label:
   *  - adds label if last empty label has been filled
   *  - removes label if some label in the middle has key and value empty
   *  - checks for duplicated key and sets validity of element
   * @param {!angular.FormController|undefined} labelForm
   * @export
   */
  check(labelForm) {
    this.addIfNeeded_();
    this.validateKey_(labelForm);
  }

  /**
   * Returns true when label is editable and is not last on the list.
   * Used to indicate whether delete icon should be shown near label.
   * @return {boolean}
   * @export
   */
  isRemovable() {
    /** @type {!DeployLabel} */
    let lastElement = this.labels[this.labels.length - 1];
    return !!(this.label.editable && this.label !== lastElement);
  }

  /**
   * Deletes row from labels list.
   * @export
   */
  deleteLabel() {
    /** @type {number} */
    let rowIdx = this.labels.indexOf(this.label);

    if (rowIdx > -1) {
      this.labels.splice(rowIdx, 1);
    }
  }

  /**
   * Adds label if last label key and value has been filled.
   * @private
   */
  addIfNeeded_() {
    /** @type {!DeployLabel} */
    let lastLabel = this.labels[this.labels.length - 1];

    if (this.isFilled_(lastLabel)) {
      this.addNewLabel_();
    }
  }

  /**
   * Adds row to labels list.
   * @private
   */
  addNewLabel_() { this.labels.push(new DeployLabel()); }

  /**
   * Validates label within label form.
   * Current checks:
   *  - duplicated key
   *  - key prefix pattern
   *  - key name pattern
   *  - key prefix length
   *  - key name length
   * @param {!angular.FormController|undefined} labelForm
   * @private
   */
  // TODO: @digitalfishpond Move these validations to directives
  validateKey_(labelForm) {
    if (angular.isDefined(labelForm)) {
      /** @type {!angular.NgModelController} */
      let elem = labelForm.key;
      /** @type {!RegExp} */
      let PrefixPattern = /^(.*\/.*)$/;
      /** @type {boolean} */
      let isPrefixed = PrefixPattern.test(this.label.key);
      /** @type {number} */
      let slashPosition = isPrefixed ? this.label.key.indexOf("/") : -1;

      /** @type {boolean} */
      let isUnique = !this.isKeyDuplicated_();
      /** @type {boolean} */
      let isKeyPrefixPatternOk = this.matchesKeyPrefixPattern_(isPrefixed, slashPosition);
      /** @type {boolean} */
      let isKeyNamePatternOk = this.matchesKeyNamePattern_(isPrefixed, slashPosition);
      /** @type {boolean} */
      let isKeyPrefixLengthOk = this.matchesKeyPrefixLength_(isPrefixed, slashPosition);
      /** @type {boolean} */
      let isKeyNameLengthOk = this.matchesKeyNameLength_(isPrefixed, slashPosition);

      elem.$setValidity('unique', isUnique);
      elem.$setValidity('prefixPattern', isKeyPrefixPatternOk);
      elem.$setValidity('namePattern', isKeyNamePatternOk);
      elem.$setValidity('prefixLength', isKeyPrefixLengthOk);
      elem.$setValidity('nameLength', isKeyNameLengthOk);
    }
  }

  /**
   * Returns true if there are 2 or more labels with the same key on the labelList,
   * false otherwise.
   * @return {boolean}
   * @private
   */
  isKeyDuplicated_() {
    /** @type {number} */
    let duplications = 0;

    this.labels.forEach((label) => {
      if (this.label.key.length !== 0 && label.key === this.label.key) {
        duplications++;
      }
    });

    return duplications > 1;
  }

  /**
   * Returns true if the label key prefix (before the "/" if there is one) matches a lowercase
   * alphanumeric character
   * optionally followed by lowercase alphanumeric or '-' or '.' and ending with a lower case
   * alphanumeric character,
   * with '.' only permitted if surrounded by lowercase alphanumeric characters (eg:
   * 'good.prefix-pattern',
   * otherwise returns false.
   * @return {boolean}
   * @param {boolean} isPrefixed
   * @param {number} slashPosition
   * @private
   */
  matchesKeyPrefixPattern_(isPrefixed, slashPosition) {
    /** @type {!RegExp} */
    let labelKeyPrefixPattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
    /** @type {string} */
    let labelPrefix = isPrefixed ? this.label.key.substring(0, slashPosition) : "valid-pattern";

    return (labelKeyPrefixPattern.test(labelPrefix));
  }

  /**
   * Returns true if the label key name (after the "/" if there is one) matches an alphanumeric
   * character (upper
   * or lower case) optionally followed by alphanumeric or -_. and ending with an alphanumeric
   * character
   * (upper or lower case), otherwise returns false.
   * @return {boolean}
   * @param {boolean} isPrefixed
   * @param {number} slashPosition
   * @private
   */
  matchesKeyNamePattern_(isPrefixed, slashPosition) {
    /** @type {!RegExp} */
    let labelKeyNamePattern = /^([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]$/;
    /** @type {string} */
    let labelName = isPrefixed ? this.label.key.substring(slashPosition + 1) : this.label.key;

    return (labelKeyNamePattern.test(labelName));
  }

  /**
   * Returns true if the label key name (after the "/" if there is one) is equal or shorter than 253
   * characters,
   * otherwise returns false.
   * @return {boolean}
   * @param {boolean} isPrefixed
   * @param {number} slashPosition
   * @private
   */
  matchesKeyPrefixLength_(isPrefixed, slashPosition) {
    /** @type {number} */
    let maxLength = 253;
    /** @type {string} */
    let labelPrefix = isPrefixed ? this.label.key.substring(0, slashPosition) : '';

    return (labelPrefix.length <= maxLength);
  }

  /**
   * Returns true if the label key name (after the "/" if there is one) is equal or shorter than 63
   * characters,
   * otherwise returns false.
   * @return {boolean}
   * @param {boolean} isPrefixed
   * @param {number} slashPosition
   * @private
   */
  matchesKeyNameLength_(isPrefixed, slashPosition) {
    /** @type {number} */
    let maxLength = 63;
    /** @type {string} */
    let labelName = isPrefixed ? this.label.key.substring(slashPosition + 1) : this.label.key;

    return (labelName.length <= maxLength);
  }

  /**
   * Returns true if label key and value are not empty, false otherwise.
   * @param {!DeployLabel} label
   * @return {boolean}
   * @private
   */
  isFilled_(label) { return label.key.length !== 0 && label.value().length !== 0; }
}
