# -*- coding: utf-8 -*-
#
# © 2014, 2015 Ian Eure.
# Author: Ian Eure <ian.eure@gmail.com>
#

"""List known tubes."""

import re
import argparse
import pystache
from tubular.tube import Tube
from . loader import load, loadjson
from . template import RENDERER

def get_parser():
    p = argparse.ArgumentParser(description="Print tube permalink pages")
    p.add_argument('--target', dest='target', default='target/',
                   help='Output directory')
    p.add_argument('tubes', metavar='TUBE', nargs='*',
                   help='Make templates for these tubes')
    return p


def hash(tubes):
    acc = {}
    for tube in tubes:
        acc[tube[0]] = tube[1:]
    return acc


def hash_adjunct(adjunct):
    for k in adjunct.iterkeys():
        adjunct[k] = set(adjunct[k])
    return adjunct


def parse_for_template(tube):
    parsed = Tube.parse(tube)
    if not parsed:
        return None

    out = [{'part': k, 'expl': v} for (k, v) in parsed]
    # print out
    return out

    # out = {'parts': [],
    #        'descs': []}
    # for (part, desc) in parsed:
    #     out['parts'].append({'part': part})
    #     out['descs'].append({'desc': desc})
    # return out


def expand_bk(tube, data, adjunct):
    if not data:
        return data

    (heater, adapter, color, g1) = data
    out = {'heater': heater,
            'adapter': adapter,
            'g1': g1}
    if tube in adjunct['red_green_swap']:
        out['notes'] = "Swap red and green when testing"
    if tube in adjunct['red_blue_swap']:
        out['notes'] = "Swap red and blue when testing"
    if adapter in adjunct['adapter_datasheets']:
        out['datasheet'] = '../adapters/BK-PRECISION_CR-%d_CRT_TUBE-TESTER_REJUVENATOR_ADAPTER.pdf' % adapter
    return out


def expand_sencore(data):
    if not data:
        return data

    (model, bias, heater, socket) = data
    return {'model': model,
            'heater': heater,
            'bias': bias,
            'socket': socket}


def is_color(bk_data):
    (_, _, color, _) = bk_data
    return "Color" if bool(color) else "B&W"


def main():
    p = get_parser()
    args = p.parse_args()
    bk = hash(loadjson('bk_data.json'))
    bk_adjunct = hash_adjunct(loadjson('bk_adjunct.json'))
    sencore = hash(loadjson('sencore_data.json'))
    monitors = loadjson('monitor_data.json')
    with load('templates/tube_page.html') as fd:
        template = pystache.parse(unicode(fd.read(), 'utf-8'))

    target = args.target
    if target[-1] != '/':
        target += '/'

    all_tubes = set(bk.keys() + sencore.keys())
    cli_tubes = set(tube.upper() for tube in args.tubes)
    build_tubes = all_tubes & cli_tubes or all_tubes
    for tube in build_tubes:
        raw = Tube.find(tube) or tube
        outf = FILE_BLACKLIST.sub('-', tube.strip())
        # if tube != outf:
        #     print "%s -> %s (%s)" % (tube, outf, raw)
        bk_data = bk.get(tube, [])
        context = {
            'tube': tube,
            'parsed': parse_for_template(raw),
            'bk': expand_bk(raw, bk_data, bk_adjunct),
            'sencore': expand_sencore(sencore.get(tube, []))}
        if bk_data:
            context['color'] = is_color(bk_data)
        if tube in bk_adjunct['red_green_swap']:
            pass
        if tube in bk_adjunct['red_blue_swap']:
            pass


        with open('%s%s.html' % (target, outf), 'w') as fd:
            fd.write(RENDERER.render(template, context).encode('utf-8'))
