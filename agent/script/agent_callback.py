#!/usr/bin/env python
from __future__ import print_function

import sysrepo as sr
import sys
import requests
import os

# Helper function for getting changes given operation, old and new value.
def get_change(op, old_val, new_val):
    data = ''
    if (op == sr.SR_OP_CREATED):
          print(1)
          data = data + "CREATED: "
          data = data + new_val.to_string()
           
    elif (op == sr.SR_OP_DELETED):
          print(2)
          data = data + "DELETED: "
          data = data + old_val.to_string()
    elif (op == sr.SR_OP_MODIFIED):
          print(3)
          data = data + "MODIFIED: "
          data = data + "old value"
          data = data + old_val.to_string()
          data = data + "new value"
          data = data + new_val.to_string()
    elif (op == sr.SR_OP_MOVED):
      print(4)
      data = data + "MOVED: " + new_val.xpath() + " after " + old_val.xpath()
    return data

# Helper function for printing events.
def ev_to_str(ev):
    if (ev == sr.SR_EV_VERIFY):
        return "verify"
    elif (ev == sr.SR_EV_APPLY):
        return "apply"
    elif (ev == sr.SR_EV_ABORT):
        return "abort"
    else:
        return "abort"

# Function to get current configuration state.
# It does so by loading all the items of a session
def get_current_config(session, module_name):
    data = ''
    select_xpath = "/" + module_name + ":*//*"

    values = session.get_items(select_xpath)

    for i in range(values.val_cnt()):
        data = data + values.val(i).to_string()

    return data
# Function to be called for subscribed client of given session whenever configuration changes.
def module_change_cb(sess, module_name, event, private_ctx):
    print ("\n\n ========== CONFIG HAS CHANGED, CURRENT RUNNING CONFIG: ==========\n")
    try:
        print ("\n\n ========== Notification " + ev_to_str(event) + " =============================================\n")
        if (sr.SR_EV_APPLY == event):
            print ("\n ========== CONFIG HAS CHANGED, CURRENT RUNNING CONFIG: ==========\n")
            print(get_current_config(sess, module_name))

        print ("\n ========== CHANGES: =============================================\n")

        change_path = "/" + module_name + ":*"

        it = sess.get_changes_iter(change_path)

        change_string = ''
        while True:
            change = sess.get_change_next(it)
            if change == None:
                break
            change_string = change_string + get_change(change.oper(), change.old_val(), change.new_val())

        print ("\n\n ========== END OF CHANGES =======================================\n")

        pload = {
          'success': 'true',
          'notification': ev_to_str(event),
          'changes': change_string,
          'current': get_current_config(sess, module_name)
        }
        r = requests.post(os.environ.get('CALLBACK_URL'), data = pload)
        print(r.text)

    except Exception as e:
        print (e)
        pload = {'success': 'false', 'message': e}
        r = requests.post(os.environ.get('CALLBACK_URL'), data = pload)
        print(r.text)

    

    return sr.SR_ERR_OK

try:
    module_name = "openconfig-platform"

    print ("Application will watch for changes in " +  module_name + "\n")

    # connect to sysrepo
    conn = sr.Connection("agent_callback")

    # start session
    sess = sr.Session(conn)

    # subscribe for changes in running config */
    subscribe = sr.Subscribe(sess)

    subscribe.module_change_subscribe(module_name, module_change_cb)

    print ("\n\n ========== READING STARTUP CONFIG: ==========\n")
    try:
        print(get_current_config(sess, module_name))
    except Exception as e:
        print (e)

    print ("\n\n ========== STARTUP CONFIG APPLIED AS RUNNING ==========\n")

    sr.global_loop()

    print ("Application exit requested, exiting.\n")

except Exception as e:
    print (e)
